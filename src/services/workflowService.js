const workflowModel = require("../models/workflow");
const workflowRunModel = require("../models/workflowRun");
const notificationModel = require("../models/notification");
const { render } = require("./templateService");
const sseService = require("./sseService");
const {
  createEmailNotification,
  createInAppNotification
} = require("../controllers/notifyController");

const sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const triggerWorkflow = async (slug, userId, variables = {}, to) => {
  const workflow = await workflowModel.findBySlug(slug);

  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }

  const run = await workflowRunModel.create({
    workflow_slug: slug,
    user_id: userId,
    variables,
    status: "running",
    current_step: 0
  });

  void executeWorkflow(run.id, workflow, userId, variables, to);
  return run;
};

const executeWorkflow = async (runId, workflow, userId, variables, to) => {
  let previousNotificationId = null;

  try {
    for (let index = 0; index < workflow.steps.length; index += 1) {
      const step = workflow.steps[index];

      if (step.delayMs) {
        await sleep(step.delayMs);
      }

      if (step.condition === "if_unread" && previousNotificationId) {
        const previous = await notificationModel.getById(previousNotificationId);

        if (previous && previous.read_at) {
          await workflowRunModel.updateStep(runId, index, "completed");
          return;
        }
      }

      const rendered = await render(step.templateSlug, variables);
      let notification;

      if (step.channel === "email") {
        const result = await createEmailNotification({
          userId,
          to,
          subject: rendered.subject,
          body: rendered.body
        });

        notification = result.notification;
      } else {
        notification = await createInAppNotification({
          userId,
          title: rendered.subject || step.templateSlug,
          body: rendered.body
        });
        sseService.push(userId, { type: "notification", notification });
      }

      previousNotificationId = notification?.id || null;
      await workflowRunModel.updateStep(runId, index + 1, "running");
    }

    await workflowRunModel.updateStep(runId, workflow.steps.length, "completed");
  } catch (_error) {
    await workflowRunModel.updateStep(runId, 0, "failed");
  }
};

module.exports = {
  triggerWorkflow
};

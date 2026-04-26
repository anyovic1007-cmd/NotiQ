const notificationModel = require("../models/notification");
const { sendEmail } = require("../services/emailService");
const { render, TemplateServiceError } = require("../services/templateService");
const sseService = require("../services/sseService");

const createHttpError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const resolveTemplatePayload = async ({
  templateSlug,
  variables,
  subject,
  title,
  body
}) => {
  if (!templateSlug) {
    return { subject, title, body };
  }

  try {
    const rendered = await render(templateSlug, variables || {});

    return {
      subject: rendered.subject || subject,
      title: rendered.subject || title || templateSlug,
      body: rendered.body
    };
  } catch (error) {
    if (error instanceof TemplateServiceError) {
      error.statusCode = error.statusCode || 404;
    }

    throw error;
  }
};

const createEmailNotification = async ({
  userId,
  to,
  subject,
  body,
  templateSlug,
  variables
}) => {
  const payload = await resolveTemplatePayload({
    templateSlug,
    variables,
    subject,
    body
  });

  if (!to) {
    throw createHttpError("Email destination is required", 400);
  }

  if (!payload.subject || !payload.body) {
    throw createHttpError("Email subject and body are required", 400);
  }

  const notification = await notificationModel.insertNotification({
    user_id: userId,
    type: "email",
    title: payload.subject,
    body: payload.body,
    status: "pending",
    retries: 0
  });

  const emailResult = await sendEmail(to, payload.subject, payload.body, {
    notificationId: notification.id
  });

  return {
    notification,
    email: emailResult
  };
};

const createInAppNotification = async ({
  userId,
  title,
  body,
  templateSlug,
  variables,
  push = true
}) => {
  const payload = await resolveTemplatePayload({
    templateSlug,
    variables,
    title,
    body
  });

  if (!payload.title || !payload.body) {
    throw createHttpError("Notification title and body are required", 400);
  }

  const notification = await notificationModel.insertNotification({
    user_id: userId,
    type: "inapp",
    title: payload.title,
    body: payload.body,
    status: "delivered",
    retries: 0
  });

  if (push) {
    sseService.push(userId, {
      type: "notification",
      notification
    });
  }

  return notification;
};

const sendEmailNotification = async (req, res, next) => {
  try {
    const result = await createEmailNotification(req.body);

    res.status(201).json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const sendInAppNotification = async (req, res, next) => {
  try {
    const notification = await createInAppNotification(req.body);

    res.status(201).json({
      success: true,
      data: notification,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationModel.getByUserId(req.params.userId);

    res.status(200).json({
      success: true,
      data: notifications,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationModel.listNotifications({
      type: req.query.type,
      status: req.query.status,
      userId: req.query.user_id,
      page: req.query.page,
      pageSize: req.query.pageSize
    });

    res.status(200).json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await notificationModel.markAsRead(req.params.id);

    if (!notification) {
      throw createHttpError("Notification not found", 404);
    }

    res.status(200).json({
      success: true,
      data: notification,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const streamNotifications = (req, res) => {
  sseService.connect(req.params.userId, res);
};

const handleWebhookTrigger = async (req, res, next) => {
  try {
    const { source, eventType, payload } = req.body;

    const eventRecord = await notificationModel.insertWebhookEvent({
      source,
      payload: { eventType, ...payload }
    });

    let result;

    if (eventType === "email") {
      const { userId, to, subject, body, templateSlug, variables } = payload;

      if (!userId || !to || (!templateSlug && (!subject || !body))) {
        throw createHttpError(
          "Webhook email payload must include userId, to, and either templateSlug or subject/body",
          400
        );
      }

      result = await createEmailNotification({
        userId,
        to,
        subject,
        body,
        templateSlug,
        variables
      });
    } else if (eventType === "inapp") {
      const { userId, title, body, templateSlug, variables } = payload;

      if (!userId || (!templateSlug && (!title || !body))) {
        throw createHttpError(
          "Webhook inapp payload must include userId and either templateSlug or title/body",
          400
        );
      }

      result = await createInAppNotification({
        userId,
        title,
        body,
        templateSlug,
        variables
      });
    } else {
      throw createHttpError("Unsupported eventType", 400);
    }

    res.status(202).json({
      success: true,
      data: {
        event: eventRecord,
        result
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmailNotification,
  createInAppNotification,
  sendEmailNotification,
  sendInAppNotification,
  getUserNotifications,
  listNotifications,
  markNotificationAsRead,
  streamNotifications,
  handleWebhookTrigger
};

const workflowModel = require("../models/workflow");
const workflowRunModel = require("../models/workflowRun");
const workflowService = require("../services/workflowService");

const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowModel.create(req.body);
    res.status(201).json({ success: true, data: workflow, error: null });
  } catch (error) {
    next(error);
  }
};

const listWorkflows = async (_req, res, next) => {
  try {
    const workflows = await workflowModel.list();
    res.status(200).json({ success: true, data: workflows, error: null });
  } catch (error) {
    next(error);
  }
};

const getWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowModel.findBySlug(req.params.slug);

    if (!workflow) {
      const error = new Error("Workflow not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: workflow, error: null });
  } catch (error) {
    next(error);
  }
};

const triggerWorkflow = async (req, res, next) => {
  try {
    const run = await workflowService.triggerWorkflow(
      req.params.slug,
      req.body.userId,
      req.body.variables || {},
      req.body.to
    );

    res.status(202).json({ success: true, data: run, error: null });
  } catch (error) {
    next(error);
  }
};

const getWorkflowRun = async (req, res, next) => {
  try {
    const run = await workflowRunModel.findById(req.params.runId);

    if (!run) {
      const error = new Error("Workflow run not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: run, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  triggerWorkflow,
  getWorkflowRun
};

const templateModel = require("../models/template");

const createTemplate = async (req, res, next) => {
  try {
    const template = await templateModel.create(req.body);
    res.status(201).json({ success: true, data: template, error: null });
  } catch (error) {
    next(error);
  }
};

const listTemplates = async (_req, res, next) => {
  try {
    const templates = await templateModel.list();
    res.status(200).json({ success: true, data: templates, error: null });
  } catch (error) {
    next(error);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const template = await templateModel.findBySlug(req.params.slug);

    if (!template) {
      const error = new Error("Template not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: template, error: null });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const current = await templateModel.findBySlug(req.params.slug);

    if (!current) {
      const error = new Error("Template not found");
      error.statusCode = 404;
      throw error;
    }

    const template = await templateModel.update(current.id, req.body);
    res.status(200).json({ success: true, data: template, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate
};

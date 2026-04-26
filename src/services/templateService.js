const templateModel = require("../models/template");

class TemplateServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

const interpolate = (value, variables) =>
  String(value || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    const next = key.split(".").reduce((acc, part) => {
      if (acc === undefined || acc === null) {
        return undefined;
      }

      return acc[part];
    }, variables);

    return next === undefined || next === null ? "" : String(next);
  });

const render = async (templateSlug, variables = {}) => {
  const template = await templateModel.findBySlug(templateSlug);

  if (!template) {
    throw new TemplateServiceError(
      "TEMPLATE_NOT_FOUND",
      `Template '${templateSlug}' was not found`,
      404
    );
  }

  return {
    subject: interpolate(template.subject || "", variables),
    body: interpolate(template.body, variables),
    template
  };
};

module.exports = {
  TemplateServiceError,
  render
};

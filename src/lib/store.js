const state = {
  notifications: [],
  webhookEvents: [],
  templates: [],
  workflows: [],
  workflowRuns: [],
  digestConfigs: [],
  digestEvents: []
};

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

module.exports = {
  state,
  createId
};

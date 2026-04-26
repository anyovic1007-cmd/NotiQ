const digestModel = require("../models/digest");
const { render } = require("./templateService");
const sseService = require("./sseService");
const { createInAppNotification } = require("../controllers/notifyController");

const timers = new Map();

const timerKey = (key, userId) => `${key}:${userId}`;

const scheduleDigest = async (key, userId) => {
  const digestConfig = await digestModel.getConfig(key, userId);

  if (!digestConfig) {
    const error = new Error("Digest config not found");
    error.statusCode = 404;
    throw error;
  }

  const mapKey = timerKey(key, userId);

  if (timers.has(mapKey)) {
    return { scheduled: false };
  }

  const timeoutId = setTimeout(() => {
    void flushDigest(key, userId);
  }, digestConfig.window_ms);

  timers.set(mapKey, timeoutId);
  return { scheduled: true };
};

const flushDigest = async (key, userId) => {
  const mapKey = timerKey(key, userId);
  const timeoutId = timers.get(mapKey);

  if (timeoutId) {
    clearTimeout(timeoutId);
    timers.delete(mapKey);
  }

  const digestConfig = await digestModel.getConfig(key, userId);

  if (!digestConfig) {
    const error = new Error("Digest config not found");
    error.statusCode = 404;
    throw error;
  }

  const events = await digestModel.getEvents(key, userId);

  if (events.length === 0) {
    return {
      delivered: false,
      count: 0
    };
  }

  const rendered = await render(digestConfig.template_slug, {
    count: events.length,
    events: events.map((item) => item.payload)
  });

  const notification = await createInAppNotification({
    userId,
    title: rendered.subject || `${key} digest`,
    body: rendered.body
  });

  sseService.push(userId, {
    type: "digest",
    key,
    notification
  });

  await digestModel.clearEvents(key, userId);

  return {
    delivered: true,
    count: events.length,
    notification
  };
};

const ingest = async (key, userId, payload) => {
  const event = await digestModel.addEvent(key, userId, payload);
  await scheduleDigest(key, userId);
  return event;
};

module.exports = {
  scheduleDigest,
  flushDigest,
  ingest
};

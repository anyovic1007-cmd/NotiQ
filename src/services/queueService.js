const Bull = require("bull");

const notificationModel = require("../models/notification");

let emailQueue;

if (process.env.NODE_ENV === "test" || !process.env.REDIS_URL) {
  emailQueue = {
    add: async (data) => ({ id: "test-job", data }),
    process: () => undefined
  };
} else {
  emailQueue = new Bull("email-retries", process.env.REDIS_URL || undefined);
}

const enqueueEmailRetry = async ({ to, subject, body, notificationId, retries = 0 }) => {
  if (retries >= 3) {
    if (notificationId) {
      await notificationModel.updateNotificationStatus(notificationId, "failed", retries);
    }

    return null;
  }

  return emailQueue.add(
    {
      to,
      subject,
      body,
      notificationId,
      retries: retries + 1
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
};

if (process.env.NODE_ENV !== "test") {
  emailQueue.process(async (job) => {
    const { sendEmail } = require("./emailService");
    const { to, subject, body, notificationId, retries } = job.data;

    if (notificationId) {
      await notificationModel.updateNotificationStatus(notificationId, "retrying", retries);
    }

    const result = await sendEmail(to, subject, body, { notificationId, retries });

    if (result.queued && notificationId && retries >= 3) {
      await notificationModel.updateNotificationStatus(notificationId, "failed", retries);
    }

    return result;
  });
}

module.exports = {
  emailQueue,
  enqueueEmailRetry
};

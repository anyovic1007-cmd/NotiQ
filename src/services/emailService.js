const nodemailer = require("nodemailer");

const notificationModel = require("../models/notification");
const { enqueueEmailRetry } = require("./queueService");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendEmail = async (to, subject, body, metadata = {}) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: body
    });

    if (metadata.notificationId) {
      await notificationModel.updateNotificationStatus(
        metadata.notificationId,
        "sent",
        metadata.retries || 0
      );
    }

    return {
      messageId: info.messageId,
      queued: false
    };
  } catch (error) {
    const retries = metadata.retries || 0;

    if (metadata.notificationId) {
      await notificationModel.updateNotificationStatus(
        metadata.notificationId,
        "queued",
        retries
      );
    }

    await enqueueEmailRetry({
      to,
      subject,
      body,
      notificationId: metadata.notificationId,
      retries
    });

    return {
      messageId: null,
      queued: true
    };
  }
};

module.exports = {
  sendEmail,
  transporter
};

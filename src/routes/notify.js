const express = require("express");

const notifyController = require("../controllers/notifyController");
const validatePayload = require("../middleware/validatePayload");

const router = express.Router();

const requireEmailContent = (req, res, next) => {
  if (req.body.templateSlug) {
    return next();
  }

  return validatePayload(["subject", "body"])(req, res, next);
};

const requireInAppContent = (req, res, next) => {
  if (req.body.templateSlug) {
    return next();
  }

  return validatePayload(["title", "body"])(req, res, next);
};

router.post(
  "/notify/email",
  validatePayload(["userId", "to"]),
  requireEmailContent,
  notifyController.sendEmailNotification
);

router.post(
  "/notify/inapp",
  validatePayload(["userId"]),
  requireInAppContent,
  notifyController.sendInAppNotification
);

router.get("/notify", notifyController.listNotifications);
router.get("/notify/stream/:userId", notifyController.streamNotifications);
router.get("/notify/:userId", notifyController.getUserNotifications);
router.patch("/notify/:id/read", notifyController.markNotificationAsRead);

module.exports = router;

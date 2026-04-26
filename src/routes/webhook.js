const express = require("express");

const notifyController = require("../controllers/notifyController");
const validatePayload = require("../middleware/validatePayload");

const router = express.Router();

router.post(
  "/webhooks/trigger",
  validatePayload(["source", "eventType", "payload"]),
  notifyController.handleWebhookTrigger
);

module.exports = router;

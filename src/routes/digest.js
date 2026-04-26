const express = require("express");

const digestController = require("../controllers/digestController");
const validatePayload = require("../middleware/validatePayload");

const router = express.Router();

router.get("/config", digestController.listConfigs);
router.post(
  "/config",
  validatePayload(["key", "userId", "windowMs", "templateSlug"]),
  digestController.upsertConfig
);
router.post(
  "/ingest",
  validatePayload(["key", "userId", "payload"]),
  digestController.ingest
);
router.post(
  "/flush",
  validatePayload(["key", "userId"]),
  digestController.flush
);
router.get("/events/:key/:userId", digestController.getEvents);

module.exports = router;

const express = require("express");

const templateController = require("../controllers/templateController");
const validatePayload = require("../middleware/validatePayload");

const router = express.Router();

router.post(
  "/",
  validatePayload(["slug", "channel", "body"]),
  templateController.createTemplate
);
router.get("/", templateController.listTemplates);
router.get("/:slug", templateController.getTemplate);
router.patch(
  "/:slug",
  validatePayload(["body"]),
  templateController.updateTemplate
);

module.exports = router;

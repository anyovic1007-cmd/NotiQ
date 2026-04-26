const express = require("express");

const workflowController = require("../controllers/workflowController");
const validatePayload = require("../middleware/validatePayload");

const router = express.Router();

router.post(
  "/",
  validatePayload(["slug", "name", "steps"]),
  workflowController.createWorkflow
);
router.get("/", workflowController.listWorkflows);
router.get("/runs/:runId", workflowController.getWorkflowRun);
router.get("/:slug", workflowController.getWorkflow);
router.post(
  "/:slug/trigger",
  validatePayload(["userId"]),
  workflowController.triggerWorkflow
);

module.exports = router;

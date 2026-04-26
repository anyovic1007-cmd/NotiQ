require("dotenv").config();

const path = require("path");
const express = require("express");

const notifyRoutes = require("./src/routes/notify");
const templateRoutes = require("./src/routes/templates");
const workflowRoutes = require("./src/routes/workflows");
const digestRoutes = require("./src/routes/digest");
const webhookRoutes = require("./src/routes/webhook");
const notificationModel = require("./src/models/notification");
const sseService = require("./src/services/sseService");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/dashboard", express.static(path.join(__dirname, "dashboard", "dist")));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" }, error: null });
});

app.get("/health/stats", async (_req, res, next) => {
  try {
    const stats = await notificationModel.getStats();
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        activeStreams: sseService.totalConnections()
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
});

app.use("/", notifyRoutes);
app.use("/templates", templateRoutes);
app.use("/workflows", workflowRoutes);
app.use("/digest", digestRoutes);
app.use("/", webhookRoutes);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "dist", "index.html"));
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    data: null,
    error: err.message || "Internal server error"
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, () => {
    console.log(`NotiQ listening on port ${port}`);
  });
}

module.exports = app;

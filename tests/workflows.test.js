process.env.NODE_ENV = "test";

const request = require("supertest");

jest.mock("../src/models/notification", () => ({
  insertNotification: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  listNotifications: jest.fn(),
  markAsRead: jest.fn(),
  updateNotificationStatus: jest.fn(),
  insertWebhookEvent: jest.fn(),
  getStats: jest.fn()
}));

jest.mock("../src/services/emailService", () => ({
  sendEmail: jest.fn()
}));

jest.mock("../src/models/workflow", () => ({
  findBySlug: jest.fn(),
  create: jest.fn(),
  list: jest.fn()
}));

jest.mock("../src/models/workflowRun", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  updateStep: jest.fn()
}));

jest.mock("../src/services/workflowService", () => ({
  triggerWorkflow: jest.fn()
}));

const app = require("../server");
const workflowModel = require("../src/models/workflow");
const workflowRunModel = require("../src/models/workflowRun");
const workflowService = require("../src/services/workflowService");

describe("Workflow routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a workflow", async () => {
    workflowModel.create.mockResolvedValue({ id: "wf-1", slug: "welcome_flow" });

    const response = await request(app).post("/workflows").send({
      slug: "welcome_flow",
      name: "Welcome flow",
      steps: [{ id: "step-1", channel: "inapp", templateSlug: "welcome" }]
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(expect.objectContaining({ id: "wf-1" }));
  });

  it("lists workflows", async () => {
    workflowModel.list.mockResolvedValue([{ id: "wf-1", slug: "welcome_flow" }]);

    const response = await request(app).get("/workflows");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("triggers a workflow run", async () => {
    workflowService.triggerWorkflow.mockResolvedValue({ id: "run-1", workflow_slug: "welcome_flow" });

    const response = await request(app).post("/workflows/welcome_flow/trigger").send({
      userId: "user-1",
      variables: { name: "Ryo" },
      to: "user@example.com"
    });

    expect(response.status).toBe(202);
    expect(response.body.data).toEqual(expect.objectContaining({ id: "run-1" }));
  });

  it("fetches a workflow run", async () => {
    workflowRunModel.findById.mockResolvedValue({ id: "run-1", status: "running" });

    const response = await request(app).get("/workflows/runs/run-1");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({ id: "run-1" }));
  });
});

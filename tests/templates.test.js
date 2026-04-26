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

jest.mock("../src/models/template", () => ({
  findBySlug: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
  update: jest.fn()
}));

const app = require("../server");
const templateModel = require("../src/models/template");

describe("Template routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a template", async () => {
    templateModel.create.mockResolvedValue({ id: "tpl-1", slug: "welcome_email" });

    const response = await request(app).post("/templates").send({
      slug: "welcome_email",
      channel: "email",
      body: "Hello {{name}}"
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(expect.objectContaining({ id: "tpl-1" }));
  });

  it("lists templates", async () => {
    templateModel.list.mockResolvedValue([{ id: "tpl-1", slug: "welcome_email" }]);

    const response = await request(app).get("/templates");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("updates a template by slug", async () => {
    templateModel.findBySlug.mockResolvedValue({ id: "tpl-1", slug: "welcome_email", body: "Old" });
    templateModel.update.mockResolvedValue({ id: "tpl-1", slug: "welcome_email", body: "New" });

    const response = await request(app).patch("/templates/welcome_email").send({ body: "New" });

    expect(response.status).toBe(200);
    expect(templateModel.update).toHaveBeenCalledWith("tpl-1", { body: "New" });
  });
});

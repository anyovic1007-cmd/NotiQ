process.env.NODE_ENV = "test";

const request = require("supertest");

jest.mock("../src/models/notification", () => ({
  insertNotification: jest.fn(),
  getByUserId: jest.fn(),
  markAsRead: jest.fn(),
  updateNotificationStatus: jest.fn(),
  insertWebhookEvent: jest.fn()
}));

jest.mock("../src/services/emailService", () => ({
  sendEmail: jest.fn()
}));

const app = require("../server");
const notificationModel = require("../src/models/notification");
const emailService = require("../src/services/emailService");

describe("NotiQ notification routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("serves the dashboard page", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Test your notification API from the browser.");
    });
  });

  describe("POST /notify/email", () => {
    it("creates an email notification and dispatches email delivery", async () => {
      notificationModel.insertNotification.mockResolvedValue({
        id: "notif-1",
        user_id: "user-1",
        type: "email",
        title: "Welcome",
        body: "Hello there",
        status: "pending",
        retries: 0
      });
      emailService.sendEmail.mockResolvedValue({
        messageId: "message-1",
        queued: false
      });

      const response = await request(app).post("/notify/email").send({
        userId: "user-1",
        to: "user@example.com",
        subject: "Welcome",
        body: "Hello there"
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          notification: expect.objectContaining({ id: "notif-1" }),
          email: {
            messageId: "message-1",
            queued: false
          }
        },
        error: null
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "user@example.com",
        "Welcome",
        "Hello there",
        { notificationId: "notif-1" }
      );
    });

    it("returns 400 when a required email field is missing", async () => {
      const response = await request(app).post("/notify/email").send({
        userId: "user-1",
        subject: "Welcome",
        body: "Hello there"
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: null,
        error: "Missing required field(s): to"
      });
    });
  });

  describe("POST /notify/inapp", () => {
    it("creates an in-app notification", async () => {
      notificationModel.insertNotification.mockResolvedValue({
        id: "notif-2",
        user_id: "user-1",
        type: "inapp",
        title: "Heads up",
        body: "A new message arrived",
        status: "delivered",
        retries: 0
      });

      const response = await request(app).post("/notify/inapp").send({
        userId: "user-1",
        title: "Heads up",
        body: "A new message arrived"
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: "notif-2",
          type: "inapp"
        }),
        error: null
      });
    });

    it("returns 400 when a required in-app field is missing", async () => {
      const response = await request(app).post("/notify/inapp").send({
        userId: "user-1",
        body: "A new message arrived"
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: null,
        error: "Missing required field(s): title"
      });
    });
  });

  describe("GET /notify/:userId", () => {
    it("returns a user's notifications", async () => {
      notificationModel.getByUserId.mockResolvedValue([
        {
          id: "notif-3",
          user_id: "user-1",
          type: "inapp",
          title: "Saved",
          body: "Your changes are live",
          status: "delivered",
          retries: 0
        }
      ]);

      const response = await request(app).get("/notify/user-1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [
          expect.objectContaining({
            id: "notif-3",
            user_id: "user-1"
          })
        ],
        error: null
      });
    });
  });
});

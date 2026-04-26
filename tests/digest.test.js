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

jest.mock("../src/models/digest", () => ({
  getConfig: jest.fn(),
  upsertConfig: jest.fn(),
  addEvent: jest.fn(),
  getEvents: jest.fn(),
  clearEvents: jest.fn(),
  listConfigs: jest.fn()
}));

jest.mock("../src/services/digestService", () => ({
  scheduleDigest: jest.fn(),
  flushDigest: jest.fn(),
  ingest: jest.fn()
}));

const app = require("../server");
const digestModel = require("../src/models/digest");
const digestService = require("../src/services/digestService");

describe("Digest routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("upserts a digest config", async () => {
    digestModel.upsertConfig.mockResolvedValue({ id: "digest-1", key: "post_likes" });

    const response = await request(app).post("/digest/config").send({
      key: "post_likes",
      userId: "user-1",
      windowMs: 3600000,
      templateSlug: "likes_digest"
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({ id: "digest-1" }));
  });

  it("ingests a digest event", async () => {
    digestService.ingest.mockResolvedValue({ id: "event-1", digest_key: "post_likes" });

    const response = await request(app).post("/digest/ingest").send({
      key: "post_likes",
      userId: "user-1",
      payload: { actor: "Alice" }
    });

    expect(response.status).toBe(202);
    expect(response.body.data).toEqual(expect.objectContaining({ id: "event-1" }));
  });

  it("lists pending digest events", async () => {
    digestModel.getEvents.mockResolvedValue([{ id: "event-1" }]);

    const response = await request(app).get("/digest/events/post_likes/user-1");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("flushes a digest", async () => {
    digestService.flushDigest.mockResolvedValue({ delivered: true, count: 3 });

    const response = await request(app).post("/digest/flush").send({
      key: "post_likes",
      userId: "user-1"
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({ delivered: true, count: 3 }));
  });
});

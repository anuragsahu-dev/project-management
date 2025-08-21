import request from "supertest";
import app from "../../src/app";

describe("GET /healthcheck", () => {
  it("should return 200 with status 'ok'", async () => {
    const res = await request(app).get("/healthcheck");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("status", "ok");
  });
});

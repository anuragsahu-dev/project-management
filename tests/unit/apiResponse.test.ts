import { describe, it, expect } from "vitest";

// ApiResponse class simulation for testing
class ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T | null;
  success: boolean;

  constructor(statusCode: number, message: string, data: T | null = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode >= 200 && statusCode < 300;
  }
}

describe("ApiResponse", () => {
  it("should create a successful response for 2xx status codes", () => {
    const response = new ApiResponse(200, "Success", { id: 1 });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Success");
    expect(response.data).toEqual({ id: 1 });
    expect(response.success).toBe(true);
  });

  it("should create an unsuccessful response for 4xx status codes", () => {
    const response = new ApiResponse(400, "Bad Request");

    expect(response.statusCode).toBe(400);
    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
  });

  it("should create an unsuccessful response for 5xx status codes", () => {
    const response = new ApiResponse(500, "Internal Server Error");

    expect(response.statusCode).toBe(500);
    expect(response.success).toBe(false);
  });

  it("should handle 201 Created response", () => {
    const response = new ApiResponse(201, "Created", { id: "abc123" });

    expect(response.statusCode).toBe(201);
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: "abc123" });
  });
});

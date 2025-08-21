import type { Response } from "express";

export class ApiResponse<T = unknown> {
  public readonly status: "OK" | "fail";
  public readonly statusCode: number;
  public readonly message: string;
  public readonly success: boolean;
  public readonly data: T | null;

  constructor(statusCode: number, message: string, data: T | null = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.status = statusCode < 400 ? "OK" : "fail";
    this.success = statusCode < 400 ? true : false;
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json({
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      success: this.success,
      status: this.status,
    });
  }
}

// public → The property is accessible from anywhere (inside or outside the class).
// readonly → The property can be set only once (usually in the constructor) and cannot be changed

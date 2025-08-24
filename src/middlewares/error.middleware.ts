import type { Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;
  public readonly errors: string[] | object | null | string;

  constructor(
    statusCode: number,
    message: string,
    errors: string[] | object | null | string = null
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

interface AppError extends Error {
  statusCode?: number;
  status?: "fail" | "error";
  isOperational?: boolean;
  errors?: string[] | object | null | string;
}

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // handling multer error
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      status: "fail",
      statusCode: 400,
      message: err.message,
    });
    return;
  }

  const error = err as AppError;

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({
      status,
      statusCode,
      message: error.message,
      errors: error.errors ?? null,
    });
  } else {
    if (error.isOperational) {
      res.status(statusCode).json({
        status,
        statusCode,
        message: error.message,
        errors: error.errors ?? null,
      });
    } else {
      // For programming or unknown errors, send generic message
      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: error.message || "Something went wrong",
        success: false,
      });
    }
  }
};

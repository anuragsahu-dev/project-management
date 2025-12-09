import type { Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";
import { config } from "../config/config";
import logger from "../config/logger";

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
) => {
  // handling multer error
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: err,
    });
  }
  const error = err as AppError;

  logger.error(error.message, { ...error, stack: error.stack });

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";

  if (config.server.nodeEnv === "development") {
    return res.status(statusCode).json({
      success: false,
      status,
      message: error.message,
      errors: error.errors ?? null,
      stack: error.stack,
    });
  }

  if (error.isOperational) {
    return res.status(statusCode).json({
      success: false,
      status,
      message: error.message,
      errors: error.errors ?? null,
    });
  }

  return res.status(500).json({
    success: false,
    status: "error",
    message: "Something went wrong",
  });
};

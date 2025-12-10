// src/middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ApiError } from "./error.middleware";

interface ValidationSchemas {
  body?: ZodType<unknown>;
  params?: ZodType<unknown>;
  query?: ZodType<unknown>;
}

export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          throw new ApiError(
            400,
            "Invalid request body",
            parsed.error.issues.map((i) => i.message)
          );
        }
        req.body = parsed.data;
      }

      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          throw new ApiError(
            400,
            "Invalid URL parameters",
            parsed.error.issues.map((i) => i.message)
          );
        }
        req.params = parsed.data as Request["params"];
      }

      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          throw new ApiError(
            400,
            "Invalid query parameters",
            parsed.error.issues.map((i) => i.message)
          );
        }
        req.query = parsed.data as Request["query"];
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };

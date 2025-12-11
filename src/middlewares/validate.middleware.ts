// src/middlewares/validate.middleware.ts
/**
 * Validation middleware for Express 5.x compatibility
 *
 * In Express 5.x, req.query, req.params, and req.body are getter-only properties.
 * This middleware stores validated data in:
 * - req.validatedQuery (for query parameters)
 * - req.validatedParams (for URL parameters)
 * - req.validatedBody (for request body)
 *
 * Controllers should use these validated properties after validation middleware.
 */
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
        req.validatedBody = parsed.data as Record<string, unknown>;
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
        req.validatedParams = parsed.data as Record<string, unknown>;
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
        req.validatedQuery = parsed.data as Request["query"];
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };

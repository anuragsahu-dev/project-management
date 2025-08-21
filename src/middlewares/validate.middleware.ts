import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ApiError } from "./error.middleware";

export const validateData = <Schema extends ZodType>(schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const messages = result.error.issues.map((item) => item.message);
      throw new ApiError(400, "Validation Error", messages);
    }

    req.body = result.data;
    next();
  };
};

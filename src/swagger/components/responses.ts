import { z } from "zod";
import { registry } from "../registry";

// Generic API Response wrapper (minimal - just for reference)
export const apiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  success: z.boolean(),
  data: z.any().optional(),
});

// Register it
registry.register("ApiResponse", apiResponseSchema);

// Common error response
export const errorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  success: z.literal(false),
  errors: z.array(z.any()).optional(),
});

registry.register("ErrorResponse", errorResponseSchema);

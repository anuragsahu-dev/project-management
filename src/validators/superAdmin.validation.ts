import { z } from "zod";

const isActive = z.boolean().refine((val) => typeof val === "boolean", {
  message: "isCompleted should be true or false",
});
export const isActiveSchema = z.object({
  isActive,
});

export type isActiveInput = z.infer<typeof isActiveSchema>;

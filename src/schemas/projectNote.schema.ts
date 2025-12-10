import { z } from "zod";
import { longTextSchema } from "./common.schema";

const projectContent = longTextSchema.max(
  1500,
  "Project content must not exceed 1500 characters"
);

export const projectNoteSchema = z.object({
  content: projectContent,
});
export type ProjectNoteInput = z.infer<typeof projectNoteSchema>;

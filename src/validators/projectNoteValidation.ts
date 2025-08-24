import { z } from "zod";

const projectContent = z
  .string()
  .trim()
  .min(10, "Project content must be atleast 10 characters")
  .max(1500, "Project content must not exceed 1500 characters");

export const projectNoteSchema = z.object({
  content: projectContent,
});

export type projectNoteInput = z.infer<typeof projectNoteSchema>;

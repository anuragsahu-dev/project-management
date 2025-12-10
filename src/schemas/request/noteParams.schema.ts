import { z } from "zod";
import { ulidSchema } from "../common.schema";

export const noteIdParamsSchema = z.object({
  noteId: ulidSchema,
});

export const projectNoteParamsSchema = z.object({
  projectId: ulidSchema,
  noteId: ulidSchema,
});

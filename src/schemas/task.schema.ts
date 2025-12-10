// src/schemas/task.schema.ts
import { z } from "zod";
import { titleSchema, longTextSchema, ulidSchema } from "./common.schema";

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const status = z.preprocess(
  (val) => (typeof val === "string" ? val.toUpperCase() : val),
  statusEnum
);

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

const attachmentSchema = z.object({
  url: z.string().url({ message: "Invalid attachment URL" }),

  mimetype: z
    .string()
    .refine((val) => (ALLOWED_MIME_TYPES as readonly string[]).includes(val), {
      message:
        "Invalid file type. Only images, PDFs, and documents are allowed.",
    }),

  size: z
    .number({ message: "File size must be a number" })
    .positive({ message: "File size must be greater than 0" })
    .max(5 * 1024 * 1024, { message: "File size must not exceed 5 MB" }),

  public_id: z.string(),
});

export const attachmentsSchema = z
  .array(attachmentSchema, {
    message: "Attachments must be an array",
  })
  .max(10, { message: "You can upload at most 10 attachments" });

const assignedToId = ulidSchema;

const isCompleted = z.boolean().default(false);

export const createTaskSchema = z.object({
  title: titleSchema,
  description: longTextSchema,
  status,
  attachments: attachmentsSchema.default([]),
  assignedToId: assignedToId.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: longTextSchema.optional(),
    status: status.optional(),
    attachments: attachmentsSchema.optional(),
    assignedToId: assignedToId.optional(),
  })
  .refine(
    (data) =>
      data.title ||
      data.description ||
      data.status ||
      data.attachments ||
      data.assignedToId !== undefined,
    {
      message: "At least one field must be provided for update",
    }
  );
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Legacy export for backward compatibility
export const taskSchema = createTaskSchema;
export type TaskInput = CreateTaskInput;

export const createSubTaskSchema = z.object({
  title: titleSchema,
});
export type CreateSubTaskInput = z.infer<typeof createSubTaskSchema>;

export const updateSubTaskSchema = z.object({
  title: titleSchema,
  isCompleted,
});
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;

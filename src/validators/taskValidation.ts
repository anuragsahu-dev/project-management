import { z } from "zod";

const title = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must not exceed 100 characters");

const description = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(1000, "Description must not exceed 1000 characters");

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const status = z
  .string()
  .transform((val) => val.toUpperCase())
  .refine((val: string) => (statusEnum.options as string[]).includes(val), {
    message: "Invalid status value",
  });

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

const assignedToId = z
  .string()
  .regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/, "Invalid assignedTo Id");

const isCompleted = z
  .boolean()
  .default(false)
  .refine((val) => typeof val === "boolean", {
    message: "isCompleted should be true or false",
  });

export const taskSchema = z.object({
  title,
  description,
  status,
  attachments: attachmentsSchema.default([]),
  assignedToId: assignedToId.optional(),
});

export type taskInput = z.infer<typeof taskSchema>;

export const createSubTaskSchema = z.object({
  title,
});

export type createSubTaskInput = z.infer<typeof createSubTaskSchema>;

export const updateSubTaskSchema = z.object({
  title,
  isCompleted,
});

export type updateSubTaskInput = z.infer<typeof updateSubTaskSchema>;

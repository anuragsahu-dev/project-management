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
    message: "Invalid status",
  });

const attachmentSchema = z.object({
  url: z.string().refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "URL must be valid" }
  ),

  mimetype: z
    .string()
    .regex(
      /^(image\/(jpeg|png|gif)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/plain)$/,
      "Invalid file type. Only images, PDFs, and docs are allowed"
    ),

  size: z
    .number("File Size must be a number")
    .positive("File size must be greater than 0")
    .max(5 * 1024 * 1024, "File size must not exceed 5 MB"),
});

const attachmentsSchema = z
  .array(attachmentSchema, "Attachment must be an array")
  .max(10, "You can upload at most 10 attachments")
  .default([]);

const assignedToId = z
  .string()
  .regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/, "Invalid assignedTo Id")
  .optional();

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
  attachments: attachmentsSchema,
  assignedToId,
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

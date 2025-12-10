// src/schemas/common.schema.ts
import { z } from "zod";

export const emailSchema = z
  .email("Enter a valid email address")
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .trim()
  .min(6, "Password must be at least 6 characters long")
  .max(60, "Password must not exceed 60 characters");

export const fullNameSchema = z
  .string()
  .trim()
  .min(4, "Full name must be at least 4 characters long")
  .max(60, "Full name must not exceed 60 characters");

export const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must not exceed 100 characters");

export const longTextSchema = z
  .string()
  .trim()
  .min(10, "Text must be at least 10 characters")
  .max(2000, "Text must not exceed 2000 characters");

export const urlSchema = z.httpUrl("Invalid URL").trim();

export const avatarIdSchema = z
  .string()
  .trim()
  .regex(/^[\w/-]+$/, "Invalid Avatar ID format");

export const ulidSchema = z.ulid("Invalid ULID format").trim();

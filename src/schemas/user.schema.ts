// src/schemas/user.schema.ts
import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  fullNameSchema,
  urlSchema,
  avatarIdSchema,
} from "./common.schema";

const email = emailSchema;
const password = passwordSchema;
const fullName = fullNameSchema;

const avatar = urlSchema;

export const registerUserSchema = z.object({
  email,
  password,
  fullName,
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email,
  password,
});
export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const emailSchemaOnly = z.object({
  email,
});
export type EmailInput = z.infer<typeof emailSchemaOnly>;

export const resetForgotPasswordSchema = z.object({
  newPassword: password,
});
export type ResetForgotPasswordInput = z.infer<
  typeof resetForgotPasswordSchema
>;

export const changeCurrentPasswordSchema = z.object({
  oldPassword: password,
  newPassword: password,
});
export type ChangeCurrentPasswordInput = z.infer<
  typeof changeCurrentPasswordSchema
>;

export const updateUserSchema = z
  .object({
    fullName: fullName.optional(),
    avatar: avatar.optional(),
    avatarId: avatarIdSchema.optional(),
  })
  .refine((data) => data.fullName || data.avatar || data.avatarId, {
    message: "At least one field must be provided for update",
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Schema for creating users by admin (requires admin password confirmation)
export const createSchema = z.object({
  email,
  password, // New user's password
  fullName,
  userPassword: password, // Admin's password for confirmation
});
export type CreateUserInput = z.infer<typeof createSchema>;

// Schema for admin password confirmation operations
export const passwordConfirmSchema = z.object({
  userPassword: password, // Admin's password for confirmation
});
export type PasswordConfirmInput = z.infer<typeof passwordConfirmSchema>;

// Schema for updating user status with password confirmation
export const userStatusWithPasswordSchema = z.object({
  isActive: z.boolean({ message: "isActive must be a boolean" }),
  userPassword: password, // Admin's password for confirmation
});
export type UserStatusWithPasswordInput = z.infer<
  typeof userStatusWithPasswordSchema
>;

export const getAllUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  role: z.enum(["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});
export type GetAllUsersQueryInput = z.infer<typeof getAllUsersQuerySchema>;

import { z } from "zod";

export const email = z
  .string()
  .trim()
  .lowercase()
  .min(8, "Email must be at least 8 characters")
  .email("Enter a valid email address");

const password = z
  .string()
  .trim()
  .min(6, "Password must be at least 6 characters long")
  .max(60, "Password must not exceed 60 characters");

const username = z
  .string()
  .trim()
  .lowercase()
  .min(4, "Username must be at least 4 characters long")
  .max(60, "Username must not exceed 60 characters");

const fullName = z
  .string()
  .trim()
  .min(4, "Full name must be at least 4 characters long")
  .max(60, "Full name must not exceed 60 characters");

export const registerUserSchema = z.object({
  email,
  password,
  username,
  fullName
});

export type registerUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email,
  password,
});

export type loginUserInput = z.infer<typeof loginUserSchema>;

export const forgotPasswordRequestSchema = z.object({
  email,
});

export type forgotPasswordRequestInput = z.infer<
  typeof forgotPasswordRequestSchema
>;

export const resetForgotPasswordSchema = z.object({
  newPassword: password,
});

export type resetForgotPasswordInput = z.infer<
  typeof resetForgotPasswordSchema
>;

export const changeCurrentPasswordSchema = z.object({
  oldPassword: password,
  newPassword: password,
});

export type changeCurrentPasswordInput = z.infer<
  typeof changeCurrentPasswordSchema
>;



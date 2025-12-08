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

const fullName = z
  .string()
  .trim()
  .min(4, "Full name must be at least 4 characters long")
  .max(60, "Full name must not exceed 60 characters");

const avatar = z
  .string()
  .trim()
  .refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Avatar URL must be valid" }
  );

const avatarId = z
  .string()
  .trim()
  .regex(/^[\w/-]+$/, "Invalid Avatar ID format");

export const registerUserSchema = z.object({
  email,
  password,
  fullName,
});

export type registerUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email,
  password,
});

export type loginUserInput = z.infer<typeof loginUserSchema>;

export const emailSchema = z.object({
  email,
});

export type emailInput = z.infer<typeof emailSchema>;

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

export const updateUserSchema = z.object({
  fullName,
  avatar: avatar.optional(),
  avatarId: avatarId.optional(),
});

export const createSchema = z.object({
  email,
  password,
  userPassword: password,
  fullName,
});

export const passwordSchema = z.object({
  userPassword: password,
});

export type passwordInput = z.infer<typeof passwordSchema>;

export type createInput = z.infer<typeof createSchema>;

export type updateUserInput = z.infer<typeof updateUserSchema>;

import { redisRateLimiter } from "../db/redis";

export const registerLimiter = redisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 7,
  message: "Too many registrations requests. Please try again later.",
  keyPrefix: "register:",
});

export const loginLimiter = redisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Too many login attempts. Please slow down.",
  keyPrefix: "login:",
});

export const forgotPasswordLimiter = redisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Try again later.",
  keyPrefix: "forgot-password:",
});

export const resetPasswordLimiter = redisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many reset attempts. Try again later.",
  keyPrefix: "reset-password:",
});

export const resendEmailLimiter = redisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many resend attempts. Please wait a moment.",
  keyPrefix: "resend-email:",
});

export const refreshTokenLimiter = redisRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many token refresh attempts. Slow down.",
  keyPrefix: "refresh-token:",
});

export const changePasswordLimiter = redisRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many password change attempts.",
  keyPrefix: "change-password:",
});

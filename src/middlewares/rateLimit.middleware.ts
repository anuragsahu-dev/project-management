import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../db/redis";
import type { RedisReply } from "rate-limit-redis";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
}

/**
 * Creates a rate limiter middleware with Redis store
 * @param options - Rate limiting configuration
 * @returns Express rate limit middleware
 */
function createRateLimiter(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: options.message || "Too many requests, please try again later.",
    },
    store: new RedisStore({
      prefix: options.keyPrefix,
      sendCommand: (command: string, ...args: string[]): Promise<RedisReply> =>
        redis.call(command, ...args) as Promise<RedisReply>,
    }),
  });
}

// ============================================================
// GLOBAL RATE LIMITER
// Applied to all /api routes
// ============================================================

/** Global rate limiter: 100 requests per 15 minutes */
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: "global:",
  message: "Too many requests, please try again later.",
});

// ============================================================
// AUTH RATE LIMITERS
// Applied to specific auth-related endpoints
// ============================================================

/** Register rate limiter: 7 attempts per 15 minutes */
export const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 7,
  keyPrefix: "register:",
  message: "Too many registration requests. Please try again later.",
});

/** Login rate limiter: 6 attempts per 15 minutes */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyPrefix: "login:",
  message: "Too many login attempts. Please slow down.",
});

/** Refresh token rate limiter: 10 attempts per 1 minute */
export const refreshTokenLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: "refresh-token:",
  message: "Too many token refresh attempts. Slow down.",
});

// ============================================================
// PASSWORD RATE LIMITERS
// ============================================================

/** Forgot password rate limiter: 5 attempts per 15 minutes */
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "forgot-password:",
  message: "Too many password reset requests. Try again later.",
});

/** Reset password rate limiter: 5 attempts per 15 minutes */
export const resetPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "reset-password:",
  message: "Too many reset attempts. Try again later.",
});

/** Change password rate limiter: 5 attempts per 5 minutes */
export const changePasswordLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyPrefix: "change-password:",
  message: "Too many password change attempts.",
});

// ============================================================
// EMAIL RATE LIMITERS
// ============================================================

/** Email verification rate limiter: 5 attempts per 15 minutes */
export const emailVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "email-verify:",
  message: "Too many verification attempts. Please try again later.",
});

/** Resend email verification rate limiter: 3 attempts per 15 minutes */
export const resendEmailLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyPrefix: "resend-email:",
  message: "Too many resend attempts. Please wait a moment.",
});

// ============================================================
// FILE UPLOAD RATE LIMITER
// ============================================================

/** File upload rate limiter: 10 attempts per 15 minutes */
export const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "upload:",
  message: "Too many upload attempts. Please try again later.",
});

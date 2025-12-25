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

// Global rate limiter: 100 requests per 15 minutes
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: "global:",
  message: "Too many requests, please try again later.",
});

// Auth rate limiter: 6 attempts per 15 minutes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyPrefix: "auth:",
  message: "Too many authentication attempts. Please slow down.",
});

// Refresh token rate limiter: 10 attempts per 15 minutes
export const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "refresh:",
  message: "Too many token refresh attempts. Please try again later.",
});

// Email verification rate limiter: 5 attempts per 15 minutes
export const emailVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "email-verify:",
  message: "Too many verification attempts. Please try again later.",
});

// Password reset rate limiter: 5 attempts per 15 minutes
export const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "password-reset:",
  message: "Too many password reset attempts. Please try again later.",
});

// File upload rate limiter: 10 attempts per 15 minutes
export const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "upload:",
  message: "Too many upload attempts. Please try again later.",
});

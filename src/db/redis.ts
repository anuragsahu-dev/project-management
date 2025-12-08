import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { RedisReply } from "rate-limit-redis";
import { config } from "../config/config";
import logger from "../config/logger";

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error("Redis error:", err));

export function redisRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
}) {
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
      sendCommand: (
        command: string,
        ...args: string[]
      ): Promise<RedisReply> => {
        return redis.call(command, ...args) as Promise<RedisReply>;
      },
    }),
  });
}

export default redis;

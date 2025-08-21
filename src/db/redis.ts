import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import type { RedisReply } from "rate-limit-redis";

const redis = new Redis({
  port: 6379,
  host: "redis", // compose.dev.yaml service name
});

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]): Promise<RedisReply> => {
      return redis.call(command, ...args) as Promise<RedisReply>;
    },
  }),
});

export default redis;

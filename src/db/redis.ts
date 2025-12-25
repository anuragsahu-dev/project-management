import Redis from "ioredis";
import { config } from "../config/config";
import logger from "../config/logger";

/**
 * Create Redis client based on environment:
 * - Production (Upstash): Uses REDIS_URL (rediss:// auto-enables TLS)
 * - Development (Docker): Uses REDIS_HOST and REDIS_PORT
 */
function createRedisClient(): Redis {
  let client: Redis;

  // If REDIS_URL is provided (Upstash/managed Redis), use it
  // ioredis automatically enables TLS when URL starts with "rediss://"
  if (config.redis.url) {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    logger.info("Using managed Redis (REDIS_URL)");
  } else {
    // Local Docker Redis
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    logger.info(
      `Using local Redis (${config.redis.host}:${config.redis.port})`
    );
  }

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) => logger.error("Redis error:", err));
  client.on("close", () => logger.warn("Redis connection closed"));

  return client;
}

const redis = createRedisClient();

export default redis;

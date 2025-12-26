import app from "./app";
import { config } from "./config/config";
import logger from "./config/logger";
import prisma from "./db/prisma";
import redis from "./db/redis";

const PORT = config.server.port;

/**
 * Graceful shutdown handler
 * Closes all connections properly before exiting
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    logger.info("Database connection closed");

    await redis.quit();
    logger.info("Redis connection closed");

    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    process.exit(1);
  }
}

/**
 * Start the server with connection checks
 */
async function startServer(): Promise<void> {
  try {
    // Check database connection
    await prisma.$connect();
    logger.info("Database connected");

    // Check Redis connection
    await redis.ping();
    logger.info("Redis connected");

    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on PORT: ${PORT} [${config.server.nodeEnv}]`);
    });

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    process.exit(1);
  }
}

startServer();

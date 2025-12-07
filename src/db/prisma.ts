import { PrismaClient } from "@prisma/client";
import { config } from "../config/config";
import logger from "../config/logger";

const prisma = new PrismaClient({
  datasources: {
    db: { url: config.database.url },
  },
  log:
    config.server.nodeEnv === "production"
      ? [
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ]
      : [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
});

if (config.server.nodeEnv !== "production") {
  prisma.$on("query", (e) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on("error", (e) => logger.error("Prisma Error:", e));
prisma.$on("warn", (e) => logger.warn("Prisma Warning:", e));

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received → closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

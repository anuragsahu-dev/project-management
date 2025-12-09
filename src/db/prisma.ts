import { PrismaClient } from "@prisma/client";
import { config } from "../config/config";
import logger from "../config/logger";

const prisma = new PrismaClient({
  datasources: {
    db: { url: config.database.url },
  },
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

prisma.$on("error", (e) => logger.error("Prisma Error:", e));
prisma.$on("warn", (e) => logger.warn("Prisma Warning:", e));

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received → closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

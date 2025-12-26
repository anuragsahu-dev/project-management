import { Router, Request, Response } from "express";
import { totalmem } from "node:os";
import prisma from "../db/prisma";
import redis from "../db/redis";
import { verifyJWT, authorizedRoles } from "../middlewares/auth.middleware";
import { Role } from "../generated/prisma/client";

const router = Router();

/**
 * Health Check Endpoints
 *
 * Different endpoints for different purposes:
 * - GET /health       → Liveness probe (is the app running?)
 * - GET /health/live  → Alias for liveness
 * - GET /health/ready → Readiness probe (can accept traffic?)
 * - GET /health/admin → Full diagnostics (admin only)
 */

// ============================================================
// TYPES
// ============================================================

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime?: number;
  checks?: Record<string, ServiceCheck>;
  system?: SystemInfo;
}

interface ServiceCheck {
  status: "up" | "down" | "degraded";
  latency?: number;
  message?: string;
}

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// ============================================================
// PUBLIC: Liveness Probe - Is the app running?
// Used by: Docker HEALTHCHECK, Kubernetes livenessProbe
// ============================================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     description: Check if the application is running. Used by Docker/Kubernetes.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is running
 */
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe (alias)
 *     description: Alias for the root liveness check.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is running
 */
router.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// PUBLIC: Readiness Probe - Can the app accept traffic?
// Used by: Kubernetes readinessProbe, Load balancers
// Checks: Database and Redis connectivity
// ============================================================

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Check if the application can accept traffic (DB & Redis connectivity).
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready to accept traffic
 *       503:
 *         description: Application is not ready (database or redis down)
 */
router.get("/ready", async (_req: Request, res: Response) => {
  const checks: Record<string, ServiceCheck> = {};
  let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

  // Check Database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (_error) {
    checks.database = {
      status: "down",
      latency: Date.now() - dbStart,
      message: "Database connection failed",
    };
    overallStatus = "unhealthy";
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = {
      status: "up",
      latency: Date.now() - redisStart,
    };
  } catch (_error) {
    checks.redis = {
      status: "down",
      latency: Date.now() - redisStart,
      message: "Redis connection failed",
    };
    overallStatus = "unhealthy";
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  };

  const statusCode = overallStatus === "healthy" ? 200 : 503;
  res.status(statusCode).json(response);
});

// ============================================================
// ADMIN ONLY: Full System Diagnostics
// Used by: Admin dashboard, debugging
// Includes: All service checks, memory, uptime, node version
// ============================================================

/**
 * Get full health status with system diagnostics
 * Exported for potential use in other parts of the application
 */
export async function getFullHealthStatus(): Promise<HealthStatus> {
  const checks: Record<string, ServiceCheck> = {};
  let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

  // Check Database with query
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "down",
      latency: Date.now() - dbStart,
      message: error instanceof Error ? error.message : "Connection failed",
    };
    overallStatus = "unhealthy";
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = {
      status: "up",
      latency: Date.now() - redisStart,
    };
  } catch (error) {
    checks.redis = {
      status: "down",
      latency: Date.now() - redisStart,
      message: error instanceof Error ? error.message : "Connection failed",
    };
    overallStatus = "unhealthy";
  }

  // Get memory usage
  const memUsage = process.memoryUsage();
  const totalMem = totalmem();
  const usedMem = memUsage.heapUsed;

  const system: SystemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100),
    },
  };

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks,
    system,
  };
}

/**
 * @swagger
 * /health/admin:
 *   get:
 *     summary: Full system diagnostics (Admin only)
 *     description: Get complete health status including memory, uptime, and service latencies.
 *     tags: [Health]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Full system health status
 *       401:
 *         description: Authentication failed. Please log in.
 *       403:
 *         description: Access Denied - Admin role required
 *       503:
 *         description: System is unhealthy
 */
router.get(
  "/admin",
  verifyJWT,
  authorizedRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  async (_req: Request, res: Response) => {
    const health = await getFullHealthStatus();
    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  }
);

export default router;

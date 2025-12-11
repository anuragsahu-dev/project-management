import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controller";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { healthCheckPublic } from "../controllers/healthcheck.controller";

const router = Router();

/**
 * @swagger
 * /health/public:
 *   get:
 *     summary: Public health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: "Server is reachable"
 */
router.get("/public", healthCheckPublic);

/**
 * @swagger
 * /health/full:
 *   get:
 *     summary: Full health check (Admin only)
 *     tags: [Health]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "System health status"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.get(
  "/full",
  verifyJWT,
  authorizedRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  healthCheck
);

export default router;

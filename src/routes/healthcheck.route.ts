import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controller";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * /healthcheck/full:
 *   get:
 *     summary: Comprehensive system health check
 *     description: Checks the status of the database, redis, and other system components. Requires Admin or Super Admin role.
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Health check passed"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  "/full",
  verifyJWT,
  authorizedRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  healthCheck
);

export default router;

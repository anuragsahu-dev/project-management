import { Router } from "express";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  createAdmin,
  createManager,
  getAllUsers,
  promoteOrDemoteManager,
  updateUserStatus,
} from "../controllers/system.controller";
import { Role } from "../generated/prisma/client";
import { validate } from "../middlewares/validate.middleware";
import {
  createSchema,
  passwordConfirmSchema,
  userStatusWithPasswordSchema,
  getAllUsersQuerySchema,
} from "../schemas/user.schema";
import { userIdParamsSchema } from "../schemas/request/params.schema";

const router = Router();

router.use(verifyJWT);

/**
 * @swagger
 * /api/v1/system:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, MANAGER, ADMIN, SUPER_ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Users retrieved successfully"
 *       400:
 *         description: "Invalid query parameters"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.get(
  "/",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ query: getAllUsersQuerySchema }),
  getAllUsers
);

/**
 * @swagger
 * /api/v1/system/manager:
 *   post:
 *     summary: Create a manager (Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - userPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *               userPassword:
 *                 type: string
 *                 description: "Admin password for confirmation"
 *     responses:
 *       201:
 *         description: "Manager created successfully"
 *       400:
 *         description: "Invalid request body | Invalid Password | User already exists with this email"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.post(
  "/manager",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ body: createSchema }),
  createManager
);

/**
 * @swagger
 * /api/v1/system/admin:
 *   post:
 *     summary: Create an admin
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - userPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *               userPassword:
 *                 type: string
 *                 description: "Your password for confirmation"
 *     responses:
 *       201:
 *         description: "Admin created successfully"
 *       400:
 *         description: "Invalid request body | Invalid Password | User already exists with this email"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.post(
  "/admin",
  authorizedRoles([Role.SUPER_ADMIN]),
  validate({ body: createSchema }),
  createAdmin
);

/**
 * @swagger
 * /api/v1/system/manager/{userId}:
 *   put:
 *     summary: Promote or demote manager (Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userPassword
 *             properties:
 *               userPassword:
 *                 type: string
 *                 description: "Admin password for confirmation"
 *     responses:
 *       200:
 *         description: "Manager role toggled successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Password"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "Access Denied: Unauthorized route"
 *       404:
 *         description: "User not found"
 */
router.put(
  "/manager/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ params: userIdParamsSchema, body: passwordConfirmSchema }),
  promoteOrDemoteManager
);

/**
 * @swagger
 * /api/v1/system/user/{userId}:
 *   put:
 *     summary: Activate or deactivate user (Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *               - userPassword
 *             properties:
 *               isActive:
 *                 type: boolean
 *               userPassword:
 *                 type: string
 *                 description: "Admin password for confirmation"
 *     responses:
 *       200:
 *         description: "User status updated successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Password"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "Access Denied: Unauthorized route"
 *       404:
 *         description: "User not found"
 */
router.put(
  "/user/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ params: userIdParamsSchema, body: userStatusWithPasswordSchema }),
  updateUserStatus
);

export default router;

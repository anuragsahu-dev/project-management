import { Router } from "express";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  createAdmin,
  createManager,
  getAllUsers,
  promoteOrDemoteManager,
  updateUserStatus,
} from "../controllers/system.controller";
import { Role } from "@prisma/client";
import { validateData } from "../middlewares/validate.middleware";
import { createSchema, passwordSchema } from "../validators/userValidation";

const router = Router();

router.use(verifyJWT);

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateSystemUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - userPassword
 *         - fullName
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *           description: Password for the new user
 *         userPassword:
 *           type: string
 *           description: Admin password for verification
 *         fullName:
 *           type: string
 *     ConfirmPassword:
 *       type: object
 *       required:
 *         - userPassword
 *       properties:
 *         userPassword:
 *           type: string
 *           description: Admin password for verification
 */

/**
 * @swagger
 * /api/v1/system/manager:
 *   post:
 *     summary: Create a Manager (Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSystemUser'
 *     responses:
 *       201:
 *         description: Manager created
 */
router.post(
  "/manager",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(createSchema),
  createManager
);

/**
 * @swagger
 * /api/v1/system/admin:
 *   post:
 *     summary: Create an Admin (Super Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSystemUser'
 *     responses:
 *       201:
 *         description: Admin created
 */
router.post(
  "/admin",
  authorizedRoles([Role.SUPER_ADMIN]),
  validateData(createSchema),
  createAdmin
);

/**
 * @swagger
 * /api/v1/system/manager/{userId}:
 *   put:
 *     summary: Promote or Demote Manager
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
 *             $ref: '#/components/schemas/ConfirmPassword'
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put(
  "/manager/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(passwordSchema),
  promoteOrDemoteManager
);

/**
 * @swagger
 * /api/v1/system/user/{userId}:
 *   put:
 *     summary: Update User Status (Block/Unblock)
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
 *             $ref: '#/components/schemas/ConfirmPassword'
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
  "/user/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(passwordSchema),
  updateUserStatus
);

/**
 * @swagger
 * /api/v1/system:
 *   get:
 *     summary: List all users
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]), getAllUsers);

export default router;

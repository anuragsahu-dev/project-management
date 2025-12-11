import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  updateUser,
  verifyEmail,
} from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  changeCurrentPasswordSchema,
  emailSchemaOnly,
  loginUserSchema,
  registerUserSchema,
  resetForgotPasswordSchema,
  updateUserSchema,
} from "../schemas/user.schema";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendEmailLimiter,
  refreshTokenLimiter,
  changePasswordLimiter,
} from "../middlewares/rateLimiters.middleware";
import { Role } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user (Admin/Manager only)
 *     tags: [Users]
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: "User registered successfully. Verification email sent."
 *       400:
 *         description: "User with this email already exists | Invalid request body"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 *       429:
 *         description: "Too many requests"
 */
router.post(
  "/register",
  registerLimiter,  
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  validate({ body: registerUserSchema }),
  registerUser
);

/**  
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: "User logged in successfully"
 *       400:
 *         description: "Invalid request body"
 *       401:
 *         description: "Invalid email or password"
 *       403:
 *         description: "Email not verified or account is deactivated"
 *       429:
 *         description: "Too many requests"
 */
router.post(
  "/login",
  loginLimiter,
  validate({ body: loginUserSchema }),
  loginUser
);

/**
 * @swagger
 * /api/v1/users/verify-email/{verificationToken}:
 *   get:
 *     summary: Verify user email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: verificationToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Email verified successfully"
 *       400:
 *         description: "Email verification token is missing | Token is invalid or expired"
 */
router.get("/verify-email/:verificationToken", verifyEmail);

/**
 * @swagger
 * /api/v1/users/refresh-access-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: "Token renewed successfully"
 *       401:
 *         description: "Unauthorized access | Invalid or expired token | Invalid token payload"
 *       403:
 *         description: "Account is deactivated"
 *       404:
 *         description: "User not found"
 *       429:
 *         description: "Too many requests"
 */
router.post("/refresh-access-token", refreshTokenLimiter, refreshAccessToken);

/**
 * @swagger
 * /api/v1/users/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: "Password reset email sent"
 *       400:
 *         description: "Invalid request body"
 *       404:
 *         description: "User does not exist"
 *       429:
 *         description: "Too many requests"
 */
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate({ body: emailSchemaOnly }),
  forgotPasswordRequest
);

/**
 * @swagger
 * /api/v1/users/reset-password/{resetToken}:
 *   post:
 *     summary: Reset password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: resetToken
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: "Password reset successfully"
 *       400:
 *         description: "Invalid request body | Invalid or expired password reset link"
 *       429:
 *         description: "Too many requests"
 */
router.post(
  "/reset-password/:resetToken",
  resetPasswordLimiter,
  validate({ body: resetForgotPasswordSchema }),
  resetForgotPassword
);

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "User logged out successfully"
 *       401:
 *         description: "Authentication failed. Please log in."
 */
router.post("/logout", verifyJWT, logoutUser);

/**
 * @swagger
 * /api/v1/users/current-user:
 *   get:
 *     summary: Get current user details
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "User data fetched successfully"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       404:
 *         description: "User not found"
 */
router.get("/current-user", verifyJWT, getCurrentUser);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change current password
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: "Password changed successfully"
 *       400:
 *         description: "Invalid request body | New password must not be the same as the old password"
 *       401:
 *         description: "Authentication failed. Please log in. | Invalid old password"
 *       404:
 *         description: "User not found"
 *       429:
 *         description: "Too many requests"
 */
router.post(
  "/change-password",
  changePasswordLimiter,
  verifyJWT,
  validate({ body: changeCurrentPasswordSchema }),
  changeCurrentPassword
);

/**
 * @swagger
 * /api/v1/users/resend-email-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: "Verification email sent"
 *       400:
 *         description: "Invalid request body"
 *       404:
 *         description: "User does not exist"
 *       409:
 *         description: "Email already verified"
 *       429:
 *         description: "Too many requests"
 */
router.post(
  "/resend-email-verification",
  resendEmailLimiter,
  validate({ body: emailSchemaOnly }),
  resendEmailVerification
);

/**
 * @swagger
 * /api/v1/users/update-user:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               avatar:
 *                 type: string
 *               avatarId:
 *                 type: string
 *     responses:
 *       200:
 *         description: "User updated successfully"
 *       400:
 *         description: "Invalid request body | Send both avatar and avatar id"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       404:
 *         description: "User not found"
 */
router.put(
  "/update-user",
  verifyJWT,
  validate({ body: updateUserSchema }),
  updateUser
);

export default router;

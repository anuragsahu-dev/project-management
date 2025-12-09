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
import { validateData } from "../middlewares/validate.middleware";
import {
  changeCurrentPasswordSchema,
  emailSchema,
  loginUserSchema,
  registerUserSchema,
  resetForgotPasswordSchema,
  updateUserSchema,
} from "../validators/userValidation";
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
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *         fullName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, SUPER_ADMIN]
 *         isEmailVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserRegister:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         fullName:
 *           type: string
 *           minLength: 4
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     UserUpdate:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *         avatar:
 *           type: string
 *         avatarId:
 *           type: string
 *     ChangePassword:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *     ForgotPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     ResetPassword:
 *       type: object
 *       required:
 *         - newPassword
 *       properties:
 *         newPassword:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     description: Register a new user. Requires ADMIN, SUPER_ADMIN, or MANAGER role tokens currently (based on route config).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or User already exists
 *       403:
 *         description: Forbidden
 */
router.post(
  "/register",
  registerLimiter,
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  validateData(registerUserSchema),
  registerUser
);
/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post("/login", loginLimiter, validateData(loginUserSchema), loginUser);
/**
 * @swagger
 * /api/v1/users/verify-email/{verificationToken}:
 *   get:
 *     summary: Verify email address
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: verificationToken
 *         schema:
 *           type: string
 *         required: true
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify-email/:verificationToken", verifyEmail);
/**
 * @swagger
 * /api/v1/users/refresh-access-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Access token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh-access-token", refreshTokenLimiter, refreshAccessToken);
/**
 * @swagger
 * /api/v1/users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPassword'
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateData(emailSchema),
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
 *         schema:
 *           type: string
 *         required: true
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password/:resetToken",
  resetPasswordLimiter,
  validateData(resetForgotPasswordSchema),
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
 *         description: Logout successful
 */
router.post("/logout", verifyJWT, logoutUser);
/**
 * @swagger
 * /api/v1/users/current-user:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/current-user", verifyJWT, getCurrentUser);
/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change current user password
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or Incorrect old password
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/change-password",
  changePasswordLimiter,
  verifyJWT,
  validateData(changeCurrentPasswordSchema),
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
 *             $ref: '#/components/schemas/ForgotPassword'
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post(
  "/resend-email-verification",
  resendEmailLimiter,
  validateData(emailSchema),
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
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/update-user",
  verifyJWT,
  validateData(updateUserSchema),
  updateUser
);

export default router;

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

router.post(
  "/register",
  registerLimiter,
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  validate({ body: registerUserSchema }),
  registerUser
);

router.post(
  "/login",
  loginLimiter,
  validate({ body: loginUserSchema }),
  loginUser
);

router.get("/verify-email/:verificationToken", verifyEmail);

router.post("/refresh-access-token", refreshTokenLimiter, refreshAccessToken);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate({ body: emailSchemaOnly }),
  forgotPasswordRequest
);

router.post(
  "/reset-password/:resetToken",
  resetPasswordLimiter,
  validate({ body: resetForgotPasswordSchema }),
  resetForgotPassword
);

router.post("/logout", verifyJWT, logoutUser);

router.get("/current-user", verifyJWT, getCurrentUser);

router.post(
  "/change-password",
  changePasswordLimiter,
  verifyJWT,
  validate({ body: changeCurrentPasswordSchema }),
  changeCurrentPassword
);

router.post(
  "/resend-email-verification",
  resendEmailLimiter,
  validate({ body: emailSchemaOnly }),
  resendEmailVerification
);

router.put(
  "/update-user",
  verifyJWT,
  validate({ body: updateUserSchema }),
  updateUser
);

export default router;

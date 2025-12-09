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
import { verifyJWT } from "../middlewares/auth.middleware";

import {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendEmailLimiter,
  refreshTokenLimiter,
  changePasswordLimiter,
} from "../middlewares/rateLimiters.middleware";

const router = Router();

// not secured route
router.post(
  "/register",
  registerLimiter,
  verifyJWT,
  validateData(registerUserSchema),
  registerUser
);
router.post("/login", loginLimiter, validateData(loginUserSchema), loginUser);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/refresh-access-token", refreshTokenLimiter, refreshAccessToken);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateData(emailSchema),
  forgotPasswordRequest
);
router.post(
  "/reset-password/:resetToken",
  resetPasswordLimiter,
  validateData(resetForgotPasswordSchema),
  resetForgotPassword
);
// secured route
router.post("/logout", verifyJWT, logoutUser);
router.get("/current-user", verifyJWT, getCurrentUser);
router.post(
  "/change-password",
  changePasswordLimiter,
  verifyJWT,
  validateData(changeCurrentPasswordSchema),
  changeCurrentPassword
);
router.post(
  "/resend-email-verification",
  resendEmailLimiter,
  validateData(emailSchema),
  resendEmailVerification
);

router.put(
  "/update-user",
  verifyJWT,
  validateData(updateUserSchema),
  updateUser
);

export default router;

// working

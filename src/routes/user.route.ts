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
  verifyEmail,
} from "../controllers/user.controller";
import { validateData } from "../middlewares/validate.middleware";
import {
  changeCurrentPasswordSchema,
  forgotPasswordRequestSchema,
  loginUserSchema,
  registerUserSchema,
  resetForgotPasswordSchema,
} from "../validators/userValidation";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// not secured route
router.post("/register", validateData(registerUserSchema), registerUser);
router.post("/login", validateData(loginUserSchema), loginUser);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/refresh-access-token", refreshAccessToken);
router.post(
  "/forgot-password",
  validateData(forgotPasswordRequestSchema),
  forgotPasswordRequest
);
router.post(
  "/reset-password/:resetToken",
  validateData(resetForgotPasswordSchema),
  resetForgotPassword
);
// secured route
router.post("/logout", verifyJWT, logoutUser);
router.get("/current-user", verifyJWT, getCurrentUser);
router.post(
  "/change-password",
  verifyJWT,
  validateData(changeCurrentPasswordSchema),
  changeCurrentPassword
);
router.post("/resend-email-verification", verifyJWT, resendEmailVerification);

export default router;

// working
import crypto from "node:crypto";
import ms from "ms";
import prisma from "../db/prisma";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError, handleAsync } from "../middlewares/error.middleware";
import logger from "../config/logger";
import { hashedPassword, isPasswordValid } from "../utils/password";
import { generateTemporaryToken } from "../utils/token";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail";
import {
  generateAccessRefreshToken,
  cookieOptions,
} from "../utils/accessRefreshToken";
import { config } from "../config/config";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
import {
  changeCurrentPasswordInput,
  emailInput,
  loginUserInput,
  registerUserInput,
  resetForgotPasswordInput,
  updateUserInput,
} from "../validators/userValidation";
import { Action, Role } from "@prisma/client";

const registerUser: RequestHandler = handleAsync(async (req, res) => {
  const creatorId = req.userId;

  if (!creatorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { email, password, fullName }: registerUserInput = req.body;

  const existedUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existedUser) {
    throw new ApiError(400, "User with this email already exists");
  }

  const hashedPasswordValue = await hashedPassword(password);
  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  const newUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        role: Role.USER,
        fullName,
        createdById: creatorId,
        password: hashedPasswordValue,
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: new Date(tokenExpiry),
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: creatorId,
        targetUserId: createdUser.id,
        action: Action.CREATE_USER,
      },
    });

    return createdUser;
  });

  await sendEmail({
    email: newUser.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      newUser.fullName,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  logger.info(`User registered: ${newUser.id}`);

  return new ApiResponse(
    201,
    "User registered successfully. Verification email sent.",
    newUser
  ).send(res);
});

const loginUser: RequestHandler = handleAsync(async (req, res) => {
  const { email, password }: loginUserInput = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || !(await isPasswordValid(password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Email not verified, first verify your email");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated, please contact support");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user.id
  );

  const responseData = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ms(config.auth.accessTokenExpiry),
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: ms(config.auth.refreshTokenExpiry),
    });

  logger.info(`User logged in: ${user.id}`);

  return new ApiResponse(200, "User Logged In successfully", responseData).send(
    res
  );
});

const logoutUser: RequestHandler = handleAsync(async (req, res) => {
  const userId = req.userId;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      refreshToken: null,
    },
  });

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions);

  logger.info(`User logged out: ${userId}`);

  return new ApiResponse(200, "User logged out successfully").send(res);
});

const getCurrentUser: RequestHandler = handleAsync(async (req, res) => {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return new ApiResponse(200, "User data fetched successfully", user).send(res);
});

const verifyEmail: RequestHandler = handleAsync(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken?.trim()) {
    throw new ApiError(400, "Email verification token is missing");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      isEmailVerified: true,
    },
  });

  const responseData = {
    id: user.id,
    email: user.email,
    isEmailVerified: true,
  };

  logger.info(`Email verified for user: ${user.id}`);

  return new ApiResponse(200, "Email is verified", responseData).send(res);
});

const resendEmailVerification: RequestHandler = handleAsync(
  async (req, res) => {
    const { email }: emailInput = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    if (user.isEmailVerified) {
      throw new ApiError(409, "Email is already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      generateTemporaryToken();

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: new Date(tokenExpiry),
      },
    });

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        user.fullName,
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/users/verify-email/${unHashedToken}`
      ),
    });

    logger.info(`Email verification resent to: ${email}`);

    return new ApiResponse(200, "Mail has been sent to your email ID").send(
      res
    );
  }
);

const refreshAccessToken: RequestHandler = handleAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized access");
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, config.auth.refreshTokenSecret) as JwtPayload;
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  if (!decoded?.id) {
    throw new ApiError(401, "Invalid token payload");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.refreshToken !== token) {
    throw new ApiError(401, "Refresh token mismatch or expired, please login");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "Account is deactivated");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user.id
  );

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ms(config.auth.accessTokenExpiry),
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: ms(config.auth.refreshTokenExpiry),
    });

  return new ApiResponse(200, "Token renewed successfully", {
    accessToken,
    refreshToken,
  }).send(res);
});

const forgotPasswordRequest: RequestHandler = handleAsync(async (req, res) => {
  const { email }: emailInput = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: new Date(tokenExpiry),
    },
  });

  await sendEmail({
    email: user.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.fullName,
      `${config.auth.forgotPasswordRedirectUrl}/${unHashedToken}`
    ),
  });

  logger.info(`Password reset requested for: ${user.id}`);

  return new ApiResponse(
    200,
    "Password reset mail has been sent on your mail id"
  ).send(res);
});

const resetForgotPassword: RequestHandler = handleAsync(async (req, res) => {
  const { resetToken } = req.params;

  const { newPassword }: resetForgotPasswordInput = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset link");
  }

  const hashedPasswordValue = await hashedPassword(newPassword);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      forgotPasswordExpiry: null,
      forgotPasswordToken: null,
      password: hashedPasswordValue,
      refreshToken: null,
    },
  });

  res.clearCookie("accessToken", { httpOnly: true, secure: true });
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });

  logger.info(`Password reset successfully for user: ${user.id}`);

  return new ApiResponse(200, "Password reset successfully").send(res);
});

const changeCurrentPassword: RequestHandler = handleAsync(async (req, res) => {
  const userId = req.userId;
  const { oldPassword, newPassword }: changeCurrentPasswordInput = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must not be the same as the old password"
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new ApiError(404, "User not found");

  const passwordCheck = await isPasswordValid(oldPassword, user.password);

  if (!passwordCheck) {
    throw new ApiError(401, "Invalid old password");
  }

  const hashedPasswordValue = await hashedPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPasswordValue,
      refreshToken: null,
    },
  });

  res.clearCookie("accessToken", { httpOnly: true, secure: true });
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });

  logger.info(`User changed password: ${userId}`);

  return new ApiResponse(
    200,
    "Password changed successfully. Please log in again."
  ).send(res);
});

const updateUser: RequestHandler = handleAsync(async (req, res) => {
  const userId = req.userId;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const { fullName, avatar, avatarId }: updateUserInput = req.body;

  if ((avatar && !avatarId) || (!avatar && avatarId)) {
    throw new ApiError(400, "Send both avatar and avatar id");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      fullName,
      ...(avatar && avatarId && { avatar, avatarId }),
    },
    select: {
      id: true,
      email: true,
      role: true,
      avatar: true,
      fullName: true,
    },
  });

  logger.info(`User updated profile: ${userId}`);

  return new ApiResponse(
    200,
    "User data updated successfully",
    updatedUser
  ).send(res);
});

const deactivateUser: RequestHandler = handleAsync(async (req, res) => {
  const userId = req.userId;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive: false,
      deactivateAt: new Date(),
    },
  });

  logger.info(`User deactivated: ${userId}`);

  return new ApiResponse(200, "User deactivated successfully").send(res);
});

// done

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
  updateUser,
  deactivateUser,
};

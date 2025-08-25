import crypto from "node:crypto";
import ms from "ms";
import prisma from "../db/prisma";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError, handleAsync } from "../middlewares/error.middleware";
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
import {
  changeCurrentPasswordInput,
  emailInput,
  loginUserInput,
  registerUserInput,
  resetForgotPasswordInput,
  updateUserInput,
} from "../validators/userValidation";
import { Role } from "@prisma/client";


// this controller is working
const registerUser = handleAsync(async (req, res) => {
  const {
    email,
    password,
    username,
    fullName,
    avatar,
    avatarId,
  }: registerUserInput = req.body;

  if (avatar && !avatarId) {
    throw new ApiError(400, "Send both avatar and avatar Id");
  }

  const existedUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or username already exists");
  }

  const hashedPasswordValue = await hashedPassword(password);

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  console.log("New user is created");

  const newUser = await prisma.user.create({
    data: {
      email,
      username,
      fullName,
      role: Role.USER,
      password: hashedPasswordValue,
      isEmailVerified: false,
      avatar,
      avatarId,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: new Date(tokenExpiry),
    },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      username: true,
    },
  });

  await sendEmail({
    email: newUser.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      newUser.username,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  return new ApiResponse(
    201,
    "User registered successfully and verification email has been sent on your email",
    newUser
  ).send(res);
});

const loginUser = handleAsync(async (req, res) => {
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
    throw new ApiError(401, "Email not verified, first verify your email");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user.id
  );

  const responseData = {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ms(config.ACCESS_TOKEN_EXPIRY),
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: ms(config.REFRESH_TOKEN_EXPIRY),
    });

  return new ApiResponse(200, "User Logged In successfully", responseData).send(
    res
  );
});

// working
const logoutUser = handleAsync(async (req, res) => {
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

  return new ApiResponse(200, "User logged out successfully").send(res);
});

// working
const getCurrentUser = handleAsync(async (req, res) => {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
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

// working
const verifyEmail = handleAsync(async (req, res) => {
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

  return new ApiResponse(200, "Email is verified", responseData).send(res);
});

// working
const resendEmailVerification = handleAsync(async (req, res) => {
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

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

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
      user.username,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  return new ApiResponse(200, "Mail has been sent to your email ID").send(res);
});

interface AccessTokenPayload extends JwtPayload {
  id: string;
}

// working
const refreshAccessToken = handleAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ApiError(401, "Unauthorized access");
  }

  let decoded: string | JwtPayload;
  try {
    decoded = jwt.verify(token, config.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  if (!decoded || typeof decoded !== "object" || !decoded.id) {
    throw new ApiError(401, "Invalid token payload");
  }

  const { id } = decoded as AccessTokenPayload;

  const { accessToken, refreshToken } = await generateAccessRefreshToken(id);

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ms(config.ACCESS_TOKEN_EXPIRY),
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: ms(config.REFRESH_TOKEN_EXPIRY),
    });

  return new ApiResponse(200, "Token renewed successfully", {
    accessToken,
    refreshToken,
  }).send(res);
});

// working
const forgotPasswordRequest = handleAsync(async (req, res) => {
  const { email }: emailInput = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { forgotPasswordToken: null, forgotPasswordExpiry: null },
  });

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
      user.username,
      `${config.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
    ),
  });

  return new ApiResponse(
    200,
    "Password reset mail has been sent on your mail id"
  ).send(res);
});

// working
const resetForgotPassword = handleAsync(async (req, res) => {
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

  return new ApiResponse(200, "Password reset successfully").send(res);
});

// working
const changeCurrentPassword = handleAsync(async (req, res) => {
  const userId = req.userId;

  const { oldPassword, newPassword }: changeCurrentPasswordInput = req.body;

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must not be the same as the old password"
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordCheck = await isPasswordValid(oldPassword, user.password);

  if (!passwordCheck) {
    throw new ApiError(401, "Invalid old password");
  }

  const hashedPasswordValue = await hashedPassword(newPassword);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPasswordValue,
    },
  });

  return new ApiResponse(200, "Password changed successfully").send(res);
});

// completed
const updateUser = handleAsync(async (req, res) => {
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
      username: true,
      email: true,
      role: true,
      avatar: true,
      fullName: true,
    },
  });

  return new ApiResponse(
    200,
    "User data updated successfully",
    updatedUser
  ).send(res);
});

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
};

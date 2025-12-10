import { registry } from "../registry";
import { z } from "zod";
import {
  registerUserSchema,
  loginUserSchema,
  emailSchemaOnly,
  resetForgotPasswordSchema,
  changeCurrentPasswordSchema,
  updateUserSchema,
} from "../../schemas/user.schema";

// POST /api/v1/users/register
registry.registerPath({
  method: "post",
  path: "/api/v1/users/register",
  tags: ["Users"],
  summary: "Register a new user (Admin/Super Admin/Manager only)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: registerUserSchema },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully. Verification email sent.",
    },
    400: {
      description: "User with this email already exists | Validation error",
    },
    401: { description: "Unauthorized" },
    403: {
      description: "Forbidden - Admin/Super Admin/Manager access required",
    },
    429: { description: "Too many requests" },
  },
});

// POST /api/v1/users/login
registry.registerPath({
  method: "post",
  path: "/api/v1/users/login",
  tags: ["Users"],
  summary: "Login user",
  request: {
    body: {
      content: {
        "application/json": { schema: loginUserSchema },
      },
    },
  },
  responses: {
    200: { description: "User Logged In successfully" },
    400: { description: "Validation error" },
    401: { description: "Invalid email or password" },
    403: {
      description:
        "Email not verified, first verify your email | Account is deactivated, please contact support",
    },
    429: { description: "Too many requests" },
  },
});

// GET /api/v1/users/verify-email/:verificationToken
registry.registerPath({
  method: "get",
  path: "/api/v1/users/verify-email/{verificationToken}",
  tags: ["Users"],
  summary: "Verify user email",
  request: {
    params: z.object({
      verificationToken: z.string(),
    }),
  },
  responses: {
    200: { description: "Email is verified" },
    400: {
      description:
        "Email verification token is missing | Token is invalid or expired",
    },
  },
});

// POST /api/v1/users/refresh-access-token
registry.registerPath({
  method: "post",
  path: "/api/v1/users/refresh-access-token",
  tags: ["Users"],
  summary: "Refresh access token",
  responses: {
    200: { description: "Token renewed successfully" },
    401: {
      description:
        "Unauthorized access | Invalid or expired token | Invalid token payload | Refresh token mismatch or expired, please login",
    },
    403: { description: "Account is deactivated" },
    404: { description: "User not found" },
    429: { description: "Too many requests" },
  },
});

// POST /api/v1/users/forgot-password
registry.registerPath({
  method: "post",
  path: "/api/v1/users/forgot-password",
  tags: ["Users"],
  summary: "Request password reset",
  request: {
    body: {
      content: {
        "application/json": { schema: emailSchemaOnly },
      },
    },
  },
  responses: {
    200: { description: "Password reset mail has been sent on your mail id" },
    400: { description: "Validation error" },
    404: { description: "User does not exists" },
    429: { description: "Too many requests" },
  },
});

// POST /api/v1/users/reset-password/:resetToken
registry.registerPath({
  method: "post",
  path: "/api/v1/users/reset-password/{resetToken}",
  tags: ["Users"],
  summary: "Reset forgotten password",
  request: {
    params: z.object({
      resetToken: z.string(),
    }),
    body: {
      content: {
        "application/json": { schema: resetForgotPasswordSchema },
      },
    },
  },
  responses: {
    200: { description: "Password reset successfully" },
    400: {
      description: "Invalid or expired password reset link | Validation error",
    },
    429: { description: "Too many requests" },
  },
});

// POST /api/v1/users/logout
registry.registerPath({
  method: "post",
  path: "/api/v1/users/logout",
  tags: ["Users"],
  summary: "Logout user",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: "User logged out successfully" },
    401: { description: "Unauthorized" },
  },
});

// GET /api/v1/users/current-user
registry.registerPath({
  method: "get",
  path: "/api/v1/users/current-user",
  tags: ["Users"],
  summary: "Get current logged-in user",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: "User data fetched successfully" },
    401: { description: "Unauthorized" },
    404: { description: "User not found" },
  },
});

// POST /api/v1/users/change-password
registry.registerPath({
  method: "post",
  path: "/api/v1/users/change-password",
  tags: ["Users"],
  summary: "Change current password",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: changeCurrentPasswordSchema },
      },
    },
  },
  responses: {
    200: { description: "Password changed successfully. Please log in again." },
    400: {
      description:
        "New password must not be the same as the old password | Validation error",
    },
    401: { description: "Unauthorized | Invalid old password" },
    404: { description: "User not found" },
    429: { description: "Too many requests" },
  },
});

// POST /api/v1/users/resend-email-verification
registry.registerPath({
  method: "post",
  path: "/api/v1/users/resend-email-verification",
  tags: ["Users"],
  summary: "Resend email verification",
  request: {
    body: {
      content: {
        "application/json": { schema: emailSchemaOnly },
      },
    },
  },
  responses: {
    200: { description: "Mail has been sent to your email ID" },
    400: { description: "Validation error" },
    404: { description: "User does not exist" },
    409: { description: "Email is already verified" },
    429: { description: "Too many requests" },
  },
});

// PUT /api/v1/users/update-user
registry.registerPath({
  method: "put",
  path: "/api/v1/users/update-user",
  tags: ["Users"],
  summary: "Update user profile",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: updateUserSchema },
      },
    },
  },
  responses: {
    200: { description: "User data updated successfully" },
    400: { description: "Send both avatar and avatar id | Validation error" },
    401: { description: "Unauthorized" },
    404: { description: "User not found" },
  },
});

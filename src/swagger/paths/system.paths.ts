import { registry } from "../registry";
import {
  createSchema,
  passwordConfirmSchema,
  getAllUsersQuerySchema,
} from "../../schemas/user.schema";
import { userIdParamsSchema } from "../../schemas/request/params.schema";

// POST /api/v1/system/manager
registry.registerPath({
  method: "post",
  path: "/api/v1/system/manager",
  tags: ["System"],
  summary: "Create a new manager (Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createSchema },
      },
    },
  },
  responses: {
    200: { description: "Manager created successfully" },
    400: {
      description:
        "Invalid Password | User already exists with this email | Validation error",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin/Super Admin access required" },
  },
});

// POST /api/v1/system/admin
registry.registerPath({
  method: "post",
  path: "/api/v1/system/admin",
  tags: ["System"],
  summary: "Create a new admin (Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createSchema },
      },
    },
  },
  responses: {
    200: { description: "Admin created successfully" },
    400: {
      description:
        "Invalid Password | User already exists with this email | Validation error",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Super Admin access required" },
  },
});

// PUT /api/v1/system/manager/:userId
registry.registerPath({
  method: "put",
  path: "/api/v1/system/manager/{userId}",
  tags: ["System"],
  summary: "Promote or demote manager (Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: passwordConfirmSchema },
      },
    },
  },
  responses: {
    200: {
      description:
        "User promoted to Manager successfully | User demoted from Manager successfully",
    },
    400: { description: "Invalid Password | Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin/Super Admin access required" },
    404: { description: "User not found" },
  },
});

// PUT /api/v1/system/user/:userId
registry.registerPath({
  method: "put",
  path: "/api/v1/system/user/{userId}",
  tags: ["System"],
  summary: "Activate or deactivate user (Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: passwordConfirmSchema },
      },
    },
  },
  responses: {
    200: {
      description:
        "User activated successfully | User deactivated successfully",
    },
    400: { description: "Invalid Password | Validation error" },
    401: { description: "Unauthorized" },
    403: {
      description:
        "Forbidden - Admin/Super Admin access required | Only USER accounts can be activated or deactivated",
    },
    404: { description: "User not found" },
  },
});

// GET /api/v1/system/
registry.registerPath({
  method: "get",
  path: "/api/v1/system",
  tags: ["System"],
  summary: "Get all users with filters (Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    query: getAllUsersQuerySchema,
  },
  responses: {
    200: { description: "Users fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin/Super Admin access required" },
  },
});

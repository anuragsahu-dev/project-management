import { registry } from "../registry";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../../schemas/project.schema";
import { emailSchemaOnly } from "../../schemas/user.schema";
import {
  projectIdParamsSchema,
  projectIdAndUserIdParamsSchema,
} from "../../schemas/request/params.schema";
import { paginationQuerySchema } from "../../schemas/request/pagination.schema";

// GET /api/v1/projects
registry.registerPath({
  method: "get",
  path: "/api/v1/projects",
  tags: ["Projects"],
  summary: "Get my projects",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: "Projects fetched successfully" },
    401: { description: "Unauthorized" },
  },
});

// GET /api/v1/projects/all
registry.registerPath({
  method: "get",
  path: "/api/v1/projects/all",
  tags: ["Projects"],
  summary: "Get all projects with pagination (Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: {
      description:
        "Projects fetched successfully | Projects fetched from cache",
    },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin/Super Admin access required" },
  },
});

// GET /api/v1/projects/:projectId
registry.registerPath({
  method: "get",
  path: "/api/v1/projects/{projectId}",
  tags: ["Projects"],
  summary: "Get project by ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
  },
  responses: {
    200: { description: "Project details fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "Project not found" },
  },
});

// POST /api/v1/projects
registry.registerPath({
  method: "post",
  path: "/api/v1/projects",
  tags: ["Projects"],
  summary: "Create a new project (Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createProjectSchema },
      },
    },
  },
  responses: {
    201: { description: "Project created successfully" },
    400: {
      description:
        "Project with name already exists | Validation error | Unauthorized",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin/Super Admin access required" },
  },
});

// PUT /api/v1/projects/:projectId
registry.registerPath({
  method: "put",
  path: "/api/v1/projects/{projectId}",
  tags: ["Projects"],
  summary: "Update project (Project Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateProjectSchema },
      },
    },
  },
  responses: {
    200: { description: "Project updated successfully" },
    400: {
      description:
        "Another project with this name already exists | No valid fields provided for update | Validation error",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Project Head only" },
    404: { description: "Project not found" },
    500: {
      description: "Internal Server Error occured while updating the project",
    },
  },
});

// DELETE /api/v1/projects/:projectId
registry.registerPath({
  method: "delete",
  path: "/api/v1/projects/{projectId}",
  tags: ["Projects"],
  summary: "Delete project (Project Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
  },
  responses: {
    200: { description: "Project deleted successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Project Head only" },
    404: { description: "Project not found" },
    500: {
      description: "Internal Server Error occurred while deleting the project",
    },
  },
});

// POST /api/v1/projects/:projectId/members
registry.registerPath({
  method: "post",
  path: "/api/v1/projects/{projectId}/members",
  tags: ["Projects"],
  summary: "Add team member to project",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: emailSchemaOnly },
      },
    },
  },
  responses: {
    201: { description: "Team member added" },
    400: {
      description:
        "User is already a member of this project | Admin and Super Admin cannot join projects | Validation error",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "User does not exist | Project not found" },
  },
});

// POST /api/v1/projects/:projectId/assign-manager
registry.registerPath({
  method: "post",
  path: "/api/v1/projects/{projectId}/assign-manager",
  tags: ["Projects"],
  summary: "Assign project manager (Project Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: emailSchemaOnly },
      },
    },
  },
  responses: {
    200: { description: "Project Manager assigned successfully" },
    400: {
      description:
        "Only a global MANAGER can be assigned as PROJECT_MANAGER | Validation error",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Project Head only" },
    404: { description: "User does not exist | Project not found" },
  },
});

// GET /api/v1/projects/:projectId/members
registry.registerPath({
  method: "get",
  path: "/api/v1/projects/{projectId}/members",
  tags: ["Projects"],
  summary: "Get project members",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
  },
  responses: {
    200: { description: "Project members fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "Project not found" },
  },
});

// DELETE /api/v1/projects/:projectId/members/:userId
registry.registerPath({
  method: "delete",
  path: "/api/v1/projects/{projectId}/members/{userId}",
  tags: ["Projects"],
  summary: "Remove member from project (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndUserIdParamsSchema,
  },
  responses: {
    200: { description: "Project member deleted successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: {
      description:
        "Cannot remove the Project Head from the project | Only Project Head or Super Admin can remove a Project Manager | Project Manager can only remove Team Members | Forbidden - Manager/Head only",
    },
    404: { description: "Project member not found" },
  },
});

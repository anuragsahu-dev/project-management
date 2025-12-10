import { registry } from "../registry";
import {
  createTaskSchema,
  updateTaskSchema,
  createSubTaskSchema,
  updateSubTaskSchema,
} from "../../schemas/task.schema";
import {
  projectIdParamsSchema,
  projectIdAndTaskIdParamsSchema,
  projectIdAndSubTaskIdParamsSchema,
} from "../../schemas/request/params.schema";

// GET /api/v1/tasks/:projectId
registry.registerPath({
  method: "get",
  path: "/api/v1/tasks/{projectId}",
  tags: ["Tasks"],
  summary: "Get all tasks for a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
  },
  responses: {
    200: { description: "Tasks fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "Project not found" },
  },
});

// POST /api/v1/tasks/:projectId
registry.registerPath({
  method: "post",
  path: "/api/v1/tasks/{projectId}",
  tags: ["Tasks"],
  summary: "Create a new task (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: createTaskSchema },
      },
    },
  },
  responses: {
    201: { description: "Task created successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Manager/Head only" },
    404: {
      description:
        "Assigned user is not a member of this project | Project not found",
    },
  },
});

// GET /api/v1/tasks/:projectId/t/:taskId
registry.registerPath({
  method: "get",
  path: "/api/v1/tasks/{projectId}/t/{taskId}",
  tags: ["Tasks"],
  summary: "Get task by ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndTaskIdParamsSchema,
  },
  responses: {
    200: { description: "Task fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "Task not found" },
  },
});

// PUT /api/v1/tasks/:projectId/t/:taskId
registry.registerPath({
  method: "put",
  path: "/api/v1/tasks/{projectId}/t/{taskId}",
  tags: ["Tasks"],
  summary: "Update task",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndTaskIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateTaskSchema },
      },
    },
  },
  responses: {
    200: { description: "Task updated successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: {
      description:
        "Task not found for this project | Assigned user is not a member of this project",
    },
  },
});

// DELETE /api/v1/tasks/:projectId/t/:taskId
registry.registerPath({
  method: "delete",
  path: "/api/v1/tasks/{projectId}/t/{taskId}",
  tags: ["Tasks"],
  summary: "Delete task (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndTaskIdParamsSchema,
  },
  responses: {
    200: { description: "Task deleted successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Manager/Head only" },
    404: { description: "Task not found for this project" },
  },
});

// POST /api/v1/tasks/:projectId/t/:taskId/subtasks
registry.registerPath({
  method: "post",
  path: "/api/v1/tasks/{projectId}/t/{taskId}/subtasks",
  tags: ["Tasks"],
  summary: "Create a subtask",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndTaskIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: createSubTaskSchema },
      },
    },
  },
  responses: {
    201: { description: "Subtask created successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Task not found" },
  },
});

// PUT /api/v1/tasks/:projectId/st/:subTaskId
registry.registerPath({
  method: "put",
  path: "/api/v1/tasks/{projectId}/st/{subTaskId}",
  tags: ["Tasks"],
  summary: "Update subtask (Creator only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndSubTaskIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateSubTaskSchema },
      },
    },
  },
  responses: {
    200: { description: "SubTask updated successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Only subtask creator can update" },
    404: { description: "Subtask not found" },
  },
});

// DELETE /api/v1/tasks/:projectId/st/:subTaskId
registry.registerPath({
  method: "delete",
  path: "/api/v1/tasks/{projectId}/st/{subTaskId}",
  tags: ["Tasks"],
  summary: "Delete subtask (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdAndSubTaskIdParamsSchema,
  },
  responses: {
    200: { description: "Subtask deleted successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Manager/Head only" },
    404: { description: "Subtask not found" },
  },
});

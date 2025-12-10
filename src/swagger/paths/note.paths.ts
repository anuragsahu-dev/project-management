import { registry } from "../registry";
import { projectNoteSchema } from "../../schemas/projectNote.schema";
import { projectIdParamsSchema } from "../../schemas/request/params.schema";
import { projectNoteParamsSchema } from "../../schemas/request/noteParams.schema";

// GET /api/v1/notes/:projectId
registry.registerPath({
  method: "get",
  path: "/api/v1/notes/{projectId}",
  tags: ["Notes"],
  summary: "List all notes for a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
  },
  responses: {
    200: { description: "Project Notes fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "Project not found" },
  },
});

// POST /api/v1/notes/:projectId
registry.registerPath({
  method: "post",
  path: "/api/v1/notes/{projectId}",
  tags: ["Notes"],
  summary: "Create a new note (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: projectNoteSchema },
      },
    },
  },
  responses: {
    201: { description: "Project note created successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Manager/Head only" },
    404: { description: "Project not found" },
  },
});

// GET /api/v1/notes/:projectId/n/:noteId
registry.registerPath({
  method: "get",
  path: "/api/v1/notes/{projectId}/n/{noteId}",
  tags: ["Notes"],
  summary: "Get note by ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectNoteParamsSchema,
  },
  responses: {
    200: { description: "Project Note fetched successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Not a project member" },
    404: { description: "Project note not found" },
  },
});

// PUT /api/v1/notes/:projectId/n/:noteId
registry.registerPath({
  method: "put",
  path: "/api/v1/notes/{projectId}/n/{noteId}",
  tags: ["Notes"],
  summary: "Update note (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectNoteParamsSchema,
    body: {
      content: {
        "application/json": { schema: projectNoteSchema },
      },
    },
  },
  responses: {
    200: { description: "Project Note updated successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Manager/Head only" },
    404: { description: "Project Note not found" },
  },
});

// DELETE /api/v1/notes/:projectId/n/:noteId
registry.registerPath({
  method: "delete",
  path: "/api/v1/notes/{projectId}/n/{noteId}",
  tags: ["Notes"],
  summary: "Delete note (Manager/Head only)",
  security: [{ cookieAuth: [] }],
  request: {
    params: projectNoteParamsSchema,
  },
  responses: {
    200: { description: "Project note deleted successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Manager/Head only" },
    404: { description: "Project note not found" },
  },
});

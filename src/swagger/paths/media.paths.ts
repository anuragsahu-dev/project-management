import { registry } from "../registry";

// POST /api/v1/upload/file
registry.registerPath({
  method: "post",
  path: "/api/v1/upload/file",
  tags: ["Media"],
  summary: "Upload a single file (Manager/Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                format: "binary",
                description: "File to upload",
              },
            },
            required: ["file"],
          },
        },
      },
    },
  },
  responses: {
    200: { description: "File uploaded successfully" },
    400: { description: "File is not present" },
    401: { description: "Unauthorized" },
    403: {
      description: "Forbidden - Manager/Admin/Super Admin access required",
    },
  },
});

// POST /api/v1/upload/files
registry.registerPath({
  method: "post",
  path: "/api/v1/upload/files",
  tags: ["Media"],
  summary: "Upload multiple files (Manager/Admin/Super Admin only)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: {
                  type: "string",
                  format: "binary",
                },
                description: "Files to upload (max 10)",
                maxItems: 10,
              },
            },
            required: ["files"],
          },
        },
      },
    },
  },
  responses: {
    200: { description: "Files uploaded successfully" },
    400: { description: "Invalid credentials" },
    401: { description: "Unauthorized" },
    403: {
      description: "Forbidden - Manager/Admin/Super Admin access required",
    },
  },
});

import { registry } from "../registry";

// GET /healthcheck/full
registry.registerPath({
  method: "get",
  path: "/healthcheck/full",
  tags: ["Health"],
  summary: "Full health check (Admin only)",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: "System is healthy" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin access required" },
    503: { description: "Service unavailable" },
  },
});

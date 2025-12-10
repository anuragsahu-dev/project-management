import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
import { config } from "../config/config";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

// Import schema registrations
import "./schemas";

// Import response schemas
import "./components/responses";

// Import all path definitions
import "./paths/user.paths";
import "./paths/project.paths";
import "./paths/task.paths";
import "./paths/note.paths";
import "./paths/media.paths";
import "./paths/system.paths";
import "./paths/healthcheck.paths";

// Generate OpenAPI 3.1 document
const generator = new OpenApiGeneratorV31(registry.definitions);

const swaggerSpec = generator.generateDocument({
  openapi: "3.1.0",
  info: {
    title: "Project Management System API",
    version: "1.0.0",
    description:
      "Complete API documentation for the Project Management System. This API provides endpoints for user management, project management, task management, and file uploads.",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}`,
      description: "Local development server",
    },
    {
      url: "https://api.yourproduction.com",
      description: "Production server",
    },
  ],
  tags: [
    { name: "Users", description: "User authentication and management" },
    { name: "Projects", description: "Project management operations" },
    { name: "Tasks", description: "Task and subtask management" },
    { name: "Notes", description: "Project notes management" },
    { name: "Media", description: "File upload operations" },
    { name: "System", description: "System administration" },
    { name: "Health", description: "Health check endpoints" },
  ],
});

const router = Router();

// JSON endpoint for raw OpenAPI spec
router.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Swagger UI
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router as swaggerRouter, swaggerSpec };
export default router;

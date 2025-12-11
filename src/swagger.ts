import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Router, Request, Response, NextFunction } from "express";
import { config } from "./config/config";
import path from "node:path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
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
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT token stored in HTTP-only cookie",
        },
      },
    },
    tags: [
      { name: "Users", description: "User authentication and management" },
      { name: "Projects", description: "Project management operations" },
      { name: "Tasks", description: "Task and subtask management" },
      { name: "Notes", description: "Project notes management" },
      { name: "Media", description: "File upload operations" },
      { name: "System", description: "System administration" },
      { name: "Health", description: "Health check endpoints" },
    ],
  },
  // Path to the API routes files where JSDoc comments are
  apis: [
    path.join(__dirname, "./routes/*.ts"),
    path.join(__dirname, "./routes/*.js"),
  ],
};

// Lazy initialization - only generate when first accessed
let swaggerSpec: ReturnType<typeof swaggerJsdoc> | null = null;

function getSwaggerSpec() {
  if (!swaggerSpec) {
    swaggerSpec = swaggerJsdoc(options);
  }
  return swaggerSpec;
}

const router = Router();

router.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(getSwaggerSpec());
});

router.use(
  "/",
  swaggerUi.serve,
  (req: Request, res: Response, next: NextFunction) => {
    swaggerUi.setup(getSwaggerSpec())(req, res, next);
  }
);

export { router as swaggerRouter, getSwaggerSpec as swaggerSpec };
export default router;

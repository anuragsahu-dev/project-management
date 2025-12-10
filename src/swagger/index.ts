import { Request, Response, Router } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "../config/config";

const router = Router();

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project Management System",
      version: "1.0.0",
      description: "API documentation for the Project Management app",
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Key authorization for API",
        },
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: "Local server",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication related endpoints" },
      { name: "Users", description: "User related endpoints" },
      { name: "Projects", description: "Project related endpoints" },
      { name: "Tasks", description: "Task related endpoints" },
      { name: "System", description: "System related endpoints" },
      { name: "Notes", description: "Note related endpoints" },
      { name: "Media", description: "Media related endpoints" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

router.get("/json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router as swaggerRouter, swaggerSpec };
export default router;

import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import { config } from "./src/config/config";
import swaggerUi from "swagger-ui-express";
// import swaggerModelValidator from "swagger-model-validator";

import type { Request, Response } from "express";

const router = express.Router();

const options: swaggerJSDoc.Options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Project Management System",
      version: "1.0.0",
      description: "API documentation for the Project Management app",
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication related endpoints",
      },
      {
        name: "Users",
        description: "User related endpoints",
      },
      {
        name: "Projects",
        description: "Project related endpoints",
      },
      {
        name: "Tasks",
        description: "Task related endpoints",
      },
      {
        name: "System",
        description: "System related endpoints",
      },
      {
        name: "Notes",
        description: "Note related endpoints",
      },
      {
        name: "Media",
        description: "Media related endpoints",
      },
    ],
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: "Local server",
      },
    ],
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
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

// swaggerModelValidator(swaggerSpec);

router.get("/json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;

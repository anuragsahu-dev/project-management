import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
import { config } from "../config/config";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

// Import all routes so they register themselves
import "../routes/user.route";
import "../routes/project.route";
import "../routes/task.route";
import "../routes/projectNote.route";
import "../routes/media.route";
import "../routes/system.route";
import "../routes/healthcheck.route";

const generator = new OpenApiGeneratorV3(registry.definitions);

const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Project Management System",
    version: "1.0.0",
    description: "API documentation for the Project Management app",
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}`,
      description: "Local server",
    },
  ],
});

const router = Router();

router.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router as swaggerRouter, swaggerSpec };
export default router;

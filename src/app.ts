import express from "express";
import cors from "cors";
import hpp from "hpp";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { redisRateLimiter } from "./db/redis";
import { globalErrorHandler } from "./middlewares/error.middleware";
import userRouter from "./routes/user.route";
import projectRouter from "./routes/project.route";
import taskRouter from "./routes/task.route";
import healthRouter from "./routes/healthcheck.route";
import noteRouter from "./routes/projectNote.route";
import mediaRouter from "./routes/media.route";
import systemRouter from "./routes/system.route";
import { config } from "./config/config";

const app = express();

// Trust the first proxy (required for correct rate limiting behind load balancers/reverse proxies)
app.set("trust proxy", 1);

// security middleware
app.use(helmet());
app.use(hpp());

if (config.server.nodeEnv !== "test") {
  app.use(
    "/api",
    redisRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      keyPrefix: "global:",
      message: "Too many requests, please try again later.",
    })
  );
}

// logging middleware

if (config.server.nodeEnv !== "production") {
  app.use(morgan("dev"));
}

// body parser

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// cors

app.use(
  cors({
    origin: config.server.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  })
);

// api routes
app.use("/health", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/upload", mediaRouter);
app.use("/api/v1/system", systemRouter);
app.use("/api-docs", async (req, res, next) => {
  const { swaggerRouter } = await import("./swagger");
  return swaggerRouter(req, res, next);
});

// 404 handler

app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: "Route not found",
    success: false,
  });
});

// global error handler

app.use(globalErrorHandler);

export default app;

import express from "express";
import cors from "cors";
import hpp from "hpp";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { limiter } from "./db/redis";
import { globalErrorHandler } from "./middlewares/error.middleware";
import userRouter from "./routes/user.route";
import projectRouter from "./routes/project.route";
import taskRouter from "./routes/task.route";
import healthRouter from "./routes/healthcheck.route";
import noteRouter from "./routes/projectNote.route";
import mediaRouter from "./routes/media.route";
import { config } from "./config/config";

const app = express();

// security middleware
app.use(helmet());
app.use(hpp());

if (config.NODE_ENV !== "test") {
  app.use("/api", limiter);
}

// logging middleware

if (config.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// body parser

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// cors

app.use(
  cors({
    origin: process.env.CLIENT_URL,
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

app.use("/healthcheck", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/upload", mediaRouter);

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

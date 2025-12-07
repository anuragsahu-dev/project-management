import express from "express";
import app from "./app";
import { config } from "./config/config";
import logger from "./config/logger";

const PORT = config.server.port;
const INTERNAL_PORT = config.server.internalPort;

app.listen(PORT, () => {
  logger.info(`Server is running on PORT: ${PORT}`)
});

// this port is for only docker, no one can access it from outside

const internal = express();

internal.get("/docker-health", (_req, res) => {
  res.status(200).send("OK");
});

internal.listen(INTERNAL_PORT, "127.0.0.1", () => {
   logger.info(`Internal health on 127.0.0.1:${INTERNAL_PORT}`)
});

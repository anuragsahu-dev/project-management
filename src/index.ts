import express from "express";
import app from "./app";
import { config } from "./config/config";

const PORT = config.PORT;
const INTERNAL_PORT = config.INTERNAL_PORT;

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

// this port is for only docker, no one can access it from outside

const internal = express();

internal.get("/docker-health", (_req, res) => {
  res.status(200).send("OK");
});

internal.listen(INTERNAL_PORT, "127.0.0.1", () => {
  console.log(`Internal health on 127.0.0.1:${INTERNAL_PORT}`);
});

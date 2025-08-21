import prisma from "../db/prisma";
import type { Request, Response } from "express";
import { handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";

// this is for admin and super admin
export const healthCheck = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "ok",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "error",
    });
  }
};

// this is for docker swarm

export const healthForDocker = handleAsync(async (_req, res) => {
  return new ApiResponse(200, "Server is running").send(res);
});

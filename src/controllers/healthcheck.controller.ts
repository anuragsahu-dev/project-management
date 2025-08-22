import prisma from "../db/prisma";
import type { Request, Response } from "express";
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
  } catch (_error) {
    res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "error",
    });
  }
};



import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { handleAsync, ApiError } from "./error.middleware";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { ProjectRole, Role } from "@prisma/client";
import prisma from "../db/prisma";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    userRole?: Role;
    projectRole?: ProjectRole;
  }
}

interface AccessTokenPayload extends JwtPayload {
  id: string;
  role: Role;
}

export const verifyJWT = handleAsync(async (req: Request, _res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    throw new ApiError(401, "Authentication failed. Please log in.");
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      config.auth.accessTokenSecret
    ) as AccessTokenPayload;

    if (!decoded.id) {
      throw new ApiError(401, "Authentication failed. Please log in.");
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (_error) {
    throw new ApiError(401, "Authentication failed. Please log in.");
  }
});

export const authorizedRoles = (allowedRoles: Role[] = []) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as { userRole: Role };
    if (!allowedRoles.includes(authReq.userRole)) {
      throw new ApiError(403, "Access Denied: Unauthorized route");
    }
    next();
  };
};

const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

export const validateProjectPermission = (allowedRoles: ProjectRole[] = []) =>
  handleAsync(async (req: Request, _res, next) => {
    const { projectId } = req.params;

    const authReq = req as {
      userId: string;
      userRole: Role;
      projectRole?: ProjectRole;
    };

    if (!ULID_REGEX.test(projectId)) {
      throw new ApiError(400, "Invalid Project Id");
    }

    if (!authReq.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const isReadRequest = req.method === "GET";

    if (authReq.userRole === Role.SUPER_ADMIN) {
      return next();
    }

    if (authReq.userRole === Role.ADMIN && isReadRequest) {
      return next();
    }

    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: authReq.userId,
          projectId,
        },
      },
    });

    if (!projectMember) {
      throw new ApiError(403, "You are not a member of this project");
    }

    authReq.projectRole = projectMember.projectRole;

    if (!allowedRoles.includes(projectMember.projectRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }

    return next();
  });

export const validateTaskPermission = (
  action: "create" | "update" | "delete" | "assign" | "view" = "view"
) =>
  handleAsync(async (req: Request, _res, next) => {
    const authReq = req as Request & {
      userId: string;
      userRole: Role;
      projectRole: ProjectRole;
    };

    const { taskId } = req.params;

    const { userRole, userId, projectRole } = authReq;

    if (userRole === Role.SUPER_ADMIN) return next();

    if (userRole === Role.ADMIN && action !== "view") {
      throw new ApiError(403, "Admins cannot modify tasks");
    }

    let task = null;
    if (taskId) {
      task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) throw new ApiError(404, "Task not found");
    }

    switch (action) {
      case "create":
        if (
          projectRole === ProjectRole.PROJECT_HEAD ||
          projectRole === ProjectRole.PROJECT_MANAGER
        ) {
          return next();
        }
        throw new ApiError(
          403,
          "Only project manager or head can create tasks"
        );

      case "update":
        if (
          projectRole === ProjectRole.PROJECT_HEAD ||
          projectRole === ProjectRole.PROJECT_MANAGER
        ) {
          return next();
        }

        if (
          projectRole === ProjectRole.TEAM_MEMBER &&
          task?.assignedToId === userId
        ) {
          return next();
        }

        throw new ApiError(403, "You cannot update this task");

      case "delete":
        if (
          projectRole === ProjectRole.PROJECT_HEAD ||
          projectRole === ProjectRole.PROJECT_MANAGER
        ) {
          return next();
        }
        throw new ApiError(403, "You do not have permission to delete tasks");

      case "assign":
        if (
          projectRole === ProjectRole.PROJECT_HEAD ||
          projectRole === ProjectRole.PROJECT_MANAGER
        ) {
          return next();
        }
        throw new ApiError(403, "You cannot assign tasks");

      case "view":
        return next();
    }
  });

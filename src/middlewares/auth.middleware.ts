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

interface AuthenticatedRequest extends Request {
  userId: string;
  userRole: Role;
}

export const authorizedRoles = (allowedRoles: Role[] = []) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
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
    const authReq = req as AuthenticatedRequest;

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

    if (!allowedRoles.includes(projectMember.projectRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }

    return next();
  });

import { Action, Role } from "@prisma/client";
import prisma from "../db/prisma";
import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import { isActiveInput } from "../validators/superAdmin.validation";
import redis from "../db/redis";

const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

const promoteUserToAdmin = handleAsync(async (req, res) => {
  const { userId } = req.params;
  const superAdminId = req.userId;

  if (!superAdminId) throw new ApiError(400, "Unauthorized");

  if (!ULID_REGEX.test(userId)) {
    throw new ApiError(400, "Invalid Id");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "ADMIN") {
    throw new ApiError(400, "User is already an admin");
  }

  const [updatedUser, _log] = await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        role: "ADMIN",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    }),
    prisma.userActionLog.create({
      data: {
        performedById: superAdminId,
        targetUserId: userId,
        action: Action.PROMOTE_TO_ADMIN,
      },
    }),
  ]);

  return new ApiResponse(
    200,
    "User promoted to admin successfully",
    updatedUser
  ).send(res);
});

const demoteAdminToUser = handleAsync(async (req, res) => {
  const { adminId } = req.params;
  const superAdminId = req.userId;

  if (!superAdminId) throw new ApiError(400, "Unauthorized");

  if (!ULID_REGEX.test(adminId)) {
    throw new ApiError(400, "Invalid Id");
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
    },
  });

  if (!admin) {
    throw new ApiError(404, "User not found");
  }

  if (admin.role === "USER") {
    throw new ApiError(400, "User is already a normal user");
  }

  const [updatedUser, _log] = await prisma.$transaction([
    prisma.user.update({
      where: {
        id: admin.id,
      },
      data: {
        role: "USER",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    }),
    prisma.userActionLog.create({
      data: {
        performedById: superAdminId,
        targetUserId: adminId,
        action: Action.DEMOTE_TO_USER,
      },
    }),
  ]);

  return new ApiResponse(
    200,
    "Admin demoted to User successfully",
    updatedUser
  ).send(res);
});

const activateOrDeactivateUser = handleAsync(async (req, res) => {
  const { userId } = req.params;
  const performedById = req.userId;

  if (!performedById) throw new ApiError(401, "Unauthorized");

  const { isActive }: isActiveInput = req.body;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isActive === isActive) {
    throw new ApiError(
      400,
      `User is already ${isActive ? "Activated" : "Deactivated"}`
    );
  }

  const [updatedUser, _log] = await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: isActive,
        ...(!isActive && { deactivateAt: new Date() }),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
      },
    }),
    prisma.userActionLog.create({
      data: {
        performedById,
        targetUserId: userId,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
      },
    }),
  ]);

  return new ApiResponse(
    200,
    `User ${isActive ? "reactivated" : "deactivated"} successfully`,
    updatedUser
  ).send(res);
});

const activateOrDeactivateAdmin = handleAsync(async (req, res) => {
  const { adminId } = req.params;
  const superAdminId = req.userId;

  if (!superAdminId) throw new ApiError(401, "Unauthorized");

  const { isActive }: isActiveInput = req.body;

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new ApiError(404, "User or admin not found");
  }

  const [updatedUser, _log] = await prisma.$transaction([
    prisma.user.update({
      where: {
        id: adminId,
      },
      data: {
        isActive: isActive,
        ...(!isActive && { deactivateAt: new Date() }),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
      },
    }),
    prisma.userActionLog.create({
      data: {
        performedById: superAdminId,
        targetUserId: adminId,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
      },
    }),
  ]);

  return new ApiResponse(
    200,
    `Admin user ${isActive ? "reactivated" : "deactivated"} successfully`,
    updatedUser
  ).send(res);
});

const getAllProjects = handleAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `SuperAdmin:all_projects:page=${page}:limit=${limit}`;
  const expiryTime = 60 * 2;

  const cachedValue = await redis.get(cacheKey);
  if (cachedValue) {
    const projects = JSON.parse(cachedValue);
    return new ApiResponse(
      200,
      "Projects data fetched successfully",
      projects
    ).send(res);
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            members: true,
            projectTasks: true,
            projectNotes: true,
          },
        },
      },
    }),
    prisma.project.count(),
  ]);

  const responseData = {
    projects,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  await redis.setex(cacheKey, expiryTime, JSON.stringify(responseData));

  return new ApiResponse(
    200,
    "Projects fetched successfully",
    responseData
  ).send(res);
});

const getProjectByIdForSuperAdmin = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const cacheKey = `SuperAdmin:project:${projectId}`;
  const expiryTime = 60 * 5;

  const cachedValue = await redis.get(cacheKey);
  if (cachedValue) {
    const project = JSON.parse(cachedValue);
    return new ApiResponse(
      200,
      "Project details fetched successfully",
      project
    ).send(res);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      displayName: true,
      description: true,
      createdAt: true,
      updatedAt: true,

      createdBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatar: true,
        },
      },

      members: {
        select: {
          id: true,
          projectRole: true,
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatar: true,
            },
          },
        },
      },

      projectTasks: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          attachments: true,
          createdAt: true,
          updatedAt: true,
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatar: true,
            },
          },
          assignedBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatar: true,
            },
          },
          subTasks: {
            select: {
              id: true,
              title: true,
              isCompleted: true,
              createdAt: true,
              updatedAt: true,
              createdBy: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },

      projectNotes: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  await redis.setex(cacheKey, expiryTime, JSON.stringify(project));

  return new ApiResponse(
    200,
    "Project details fetched successfully",
    project
  ).send(res);
});

const getAllAdmins = handleAsync(async (_req, res) => {
  const admins = await prisma.user.findMany({
    where: {
      role: Role.ADMIN,
    },
    select: {
      id: true,
      avatar: true,
      fullName: true,
      email: true,
      username: true,
      isActive: true,
      createdAt: true,
      createdProjects: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  return new ApiResponse(200, "Admins fetched successfully", admins).send(res);
});

const getAdminById = handleAsync(async (req, res) => {
  const { adminId } = req.params;

  if (!ULID_REGEX.test(adminId)) {
    throw new ApiError(400, "Invalid Admin Id");
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      avatar: true,
      fullName: true,
      email: true,
      username: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,

      createdProjects: {
        select: {
          id: true,
          displayName: true,
          createdAt: true,
        },
      },

      taskAssignedBy: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },

      notesCreatedBy: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  return new ApiResponse(200, "Admin profile fetched successfully", admin).send(
    res
  );
});

const getAllActiveUsers = handleAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        avatar: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: { isActive: true },
    }),
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return new ApiResponse(200, "Active users fetched successfully", {
    users,
    pagination: {
      totalUsers,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  }).send(res);
});

export {
  promoteUserToAdmin,
  demoteAdminToUser,
  activateOrDeactivateUser,
  activateOrDeactivateAdmin,
  getAllProjects,
  getProjectByIdForSuperAdmin,
  getAllAdmins,
  getAdminById,
  getAllActiveUsers
};

/*
Projects

getAllProjects → paginated list of all projects (overview)

getProjectById → full details of one project

Admins

getAllAdmins → list all admins with summary

getAdminById → details of one admin & their created projects

Users

getAllUsers → list all active users

getUserById → details of one user (projects, tasks, etc.)

getAllDeactivatedUsers → list only users with status = DEACTIVATED
*/

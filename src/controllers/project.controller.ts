import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import prisma from "../db/prisma";
import {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";
import { ProjectRole, Role } from "../generated/prisma/client";
import logger from "../config/logger";
import redis from "../db/redis";
import { EmailInput } from "../schemas/user.schema";
import { CACHE } from "../constants";
import { PaginationQueryInput } from "../schemas/request/pagination.schema";
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from "../types/express";

// done
const getMyProjects = handleAsync(async (req, res) => {
  const userId = req.userId;

  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          createdAt: true,
          createdById: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              projectTasks: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Format the final response
  const formatted = memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    displayName: m.project.displayName,
    description: m.project.description,
    createdAt: m.project.createdAt,

    createdBy: {
      id: m.project.createdBy.id,
      fullName: m.project.createdBy.fullName,
      email: m.project.createdBy.email,
    },

    membersCount: m.project._count.members,
    tasksCount: m.project._count.projectTasks,

    projectRole: m.projectRole, // TEAM_MEMBER, PROJECT_MANAGER, PROJECT_HEAD
  }));

  return new ApiResponse(200, "Projects fetched successfully", formatted).send(
    res
  );
});

// done
const getProjectById = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      createdAt: true,
      updatedAt: true,

      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        },
      },

      members: {
        select: {
          userId: true,
          projectRole: true,
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
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const responseData = {
    id: project.id,
    name: project.name,
    displayName: project.displayName,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,

    createdBy: project.createdBy,

    counts: {
      members: project._count.members,
      tasks: project._count.projectTasks,
      notes: project._count.projectNotes,
    },
  };

  return new ApiResponse(
    200,
    "Project details fetched successfully",
    responseData
  ).send(res);
});

// done
const createProject = handleAsync(async (req, res) => {
  const userId = req.userId;
  if (!userId) throw new ApiError(400, "Unauthorized");

  const { displayName, description } =
    getValidatedBody<CreateProjectInput>(req);

  const normalizedName = displayName.toLowerCase();

  const existingProject = await prisma.project.findUnique({
    where: { name: normalizedName },
  });

  if (existingProject) {
    throw new ApiError(
      400,
      `Project with name "${existingProject.name}" already exists`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: normalizedName,
        displayName,
        description,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        createdById: true,
      },
    });

    await tx.projectMember.create({
      data: {
        userId,
        projectId: project.id,
        projectRole: ProjectRole.PROJECT_HEAD,
      },
    });

    return project;
  });

  await redis.del("projects:all:*");

  logger.info(`Project created: ${result.id} by ${userId}`);

  return new ApiResponse(201, "Project created successfully", result).send(res);
});

// done
const updateProject = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);

  const { displayName, description } =
    getValidatedBody<UpdateProjectInput>(req);

  const updateData: {
    name?: string;
    displayName?: string;
    description?: string;
  } = {};

  if (displayName !== undefined) {
    const newName = displayName.toLowerCase();

    const existing = await prisma.project.findUnique({
      where: { name: newName },
    });

    if (existing && existing.id !== projectId) {
      throw new ApiError(400, "Another project with this name already exists");
    }

    updateData.name = newName;
    updateData.displayName = displayName;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  let project;
  try {
    project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });
  } catch (error) {
    logger.error("Failed to update project", {
      projectId,
      displayName,
      description,
      error,
    });
    throw new ApiError(
      500,
      "Internal Server Error occured while updating the project"
    );
  }

  await redis.del("projects:all:*");

  logger.info(`Project updated: ${projectId}`);

  return new ApiResponse(200, "Project updated successfully", project).send(
    res
  );
});

// done
const deleteProject = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);

  let project;
  try {
    // Deleting the project will automatically delete all related members, tasks, subtasks, and notes
    project = await prisma.project.delete({
      where: { id: projectId },
    });
  } catch (error) {
    logger.error("Failed to delete project", {
      projectId,
      error,
    });
    throw new ApiError(
      500,
      "Internal Server Error occurred while deleting the project"
    );
  }

  await redis.del("projects:all:*");

  logger.info(`Project deleted: ${projectId}`);

  return new ApiResponse(200, "Project deleted successfully", project).send(
    res
  );
});

// done
const addTeamMemberToProject = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);
  const { email } = getValidatedBody<EmailInput>(req);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user) throw new ApiError(404, "User does not exist");

  const existing = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: user.id, projectId },
    },
  });

  if (existing) {
    throw new ApiError(400, "User is already a member of this project");
  }

  if (([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(user.role)) {
    throw new ApiError(400, "Admin and Super Admin cannot join projects");
  }

  const member = await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId,
      projectRole: ProjectRole.TEAM_MEMBER,
    },
  });

  logger.info(`Member added to project: ${user.id} to project: ${projectId}`);

  return new ApiResponse(201, "Team member added", member).send(res);
});

const assignProjectManager = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);
  const { email } = getValidatedBody<EmailInput>(req);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user) throw new ApiError(404, "User does not exist");

  if (user.role !== Role.MANAGER) {
    throw new ApiError(
      400,
      "Only a global MANAGER can be assigned as PROJECT_MANAGER"
    );
  }

  const currentManager = await prisma.projectMember.findFirst({
    where: { projectId, projectRole: ProjectRole.PROJECT_MANAGER },
  });

  const updatedManager = await prisma.$transaction(async (tx) => {
    if (currentManager) {
      await tx.projectMember.update({
        where: { id: currentManager.id },
        data: { projectRole: ProjectRole.TEAM_MEMBER },
      });
    }

    const existingMembership = await tx.projectMember.findUnique({
      where: {
        userId_projectId: { userId: user.id, projectId },
      },
    });

    let result;

    if (existingMembership) {
      result = await tx.projectMember.update({
        where: { id: existingMembership.id },
        data: { projectRole: ProjectRole.PROJECT_MANAGER },
      });
    } else {
      result = await tx.projectMember.create({
        data: {
          userId: user.id,
          projectId,
          projectRole: ProjectRole.PROJECT_MANAGER,
        },
      });
    }

    return result;
  });

  logger.info(`Project Manager assigned: ${email} for project: ${projectId}`);

  return new ApiResponse(
    200,
    "Project Manager assigned successfully",
    updatedManager
  ).send(res);
});

// done
const getProjectMembers = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);

  const projectMembers = await prisma.projectMember.findMany({
    where: {
      projectId,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return new ApiResponse(
    200,
    "Project members fetched successfully",
    projectMembers
  ).send(res);
});

// done
const deleteMember = handleAsync(async (req, res) => {
  const { projectId, userId } = getValidatedParams<{
    projectId: string;
    userId: string;
  }>(req);
  const performerId = req.userId;

  if (!performerId) {
    throw new ApiError(401, "Unauthorized");
  }

  const targetMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!targetMember) {
    throw new ApiError(404, "Project member not found");
  }

  const performerIsSuperAdmin = req.userRole === Role.SUPER_ADMIN;

  const performerMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: performerId, projectId } },
  });

  const performerIsHead =
    performerMember?.projectRole === ProjectRole.PROJECT_HEAD;

  const performerIsManager =
    performerMember?.projectRole === ProjectRole.PROJECT_MANAGER;

  if (targetMember.projectRole === ProjectRole.PROJECT_HEAD) {
    throw new ApiError(403, "Cannot remove the Project Head from the project");
  }
  if (targetMember.projectRole === ProjectRole.PROJECT_MANAGER) {
    if (!performerIsSuperAdmin && !performerIsHead) {
      throw new ApiError(
        403,
        "Only Project Head or Super Admin can remove a Project Manager"
      );
    }
  }

  if (performerIsManager) {
    if (targetMember.projectRole !== ProjectRole.TEAM_MEMBER) {
      throw new ApiError(403, "Project Manager can only remove Team Members");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.updateMany({
      where: { assignedToId: userId, projectId },
      data: { assignedToId: null },
    });
    await tx.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  });

  logger.info(`Member removed: ${userId} from project: ${projectId}`);

  return new ApiResponse(200, "Project member deleted successfully", {
    userId,
    projectId,
  }).send(res);
});

// done
const getProjects = handleAsync(async (req, res) => {
  const { page = 1, limit = 10 } = getValidatedQuery<PaginationQueryInput>(req);
  const skip = (page - 1) * limit;

  const cacheKey = `projects:all:page=${page}:limit=${limit}`;
  const expiry = CACHE.PROJECT_LIST_TTL;

  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    return new ApiResponse(200, "Projects fetched from cache", data).send(res);
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
            fullName: true,
            email: true,
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

  await redis.setex(cacheKey, expiry, JSON.stringify(responseData));

  return new ApiResponse(
    200,
    "Projects fetched successfully",
    responseData
  ).send(res);
});

export {
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addTeamMemberToProject,
  assignProjectManager,
  getProjectMembers,
  deleteMember,
  getProjects,
};

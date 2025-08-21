import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import prisma from "../db/prisma";
import {
  addMemberInput,
  projectInput,
  updateMemberRoleInput,
} from "../validators/projectValidation";
import { Prisma, ProjectRole } from "@prisma/client";

// checked
const getProjects = handleAsync(async (req, res) => {
  const userId = req.userId;

  const projects = await prisma.projectMember.findMany({
    where: {
      userId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          createdAt: true,
          createdById: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  const formattedProjects = projects.map((pm) => ({
    project: {
      id: pm.project.id,
      name: pm.project.name,
      displayName: pm.project.displayName,
      description: pm.project.description,
      createdAt: pm.project.createdAt,
      createdBy: pm.project.createdById,
      members: pm.project._count.members,
    },
    role: pm.projectRole,
  }));

  return new ApiResponse(
    200,
    "Projects fetched successfully",
    formattedProjects
  ).send(res);
}); // only is the member of the project can get data of that project

const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

// checked
const getProjectById = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return new ApiResponse(
    200,
    "Project data fetched successfully",
    project
  ).send(res);
});

//checked
const createProject = handleAsync(async (req, res) => {
  const userId = req.userId;

  if (!userId) throw new ApiError(400, "unauthorized");

  const { displayName, description }: projectInput = req.body;

  const existingProject = await prisma.project.findUnique({
    where: { name: displayName.toLowerCase() },
  });

  if (existingProject) {
    throw new ApiError(
      400,
      `Project with this name ${existingProject.name} already exists`
    );
  }

  const project = await prisma.project.create({
    data: {
      name: displayName.toLowerCase(),
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

  await prisma.projectMember.create({
    data: {
      userId,
      projectId: project.id,
      projectRole: ProjectRole.OWNER,
    },
  });

  return new ApiResponse(201, "Project created successfully", project).send(
    res
  );
});

// checked
const updateProject = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const { displayName, description }: projectInput = req.body;

  const existing = await prisma.project.findUnique({
    where: { name: displayName.toLowerCase() },
  });

  if (existing && existing.id !== projectId) {
    throw new ApiError(400, "Another project with this name already exists");
  }

  let project;
  try {
    project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: displayName.toLowerCase(),
        displayName,
        description,
      },
    });
  } catch (_error) {
    throw new ApiError(
      500,
      "Internal Server Error occured while updating the project"
    );
  }

  return new ApiResponse(200, "Project updated successfully", project).send(
    res
  );
});

// checked
const deleteProject = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  let project;
  try {
    // Deleting the project will automatically delete all related members, tasks, subtasks, and notes
    project = await prisma.project.delete({
      where: { id: projectId },
    });
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Internal Server Error occurred while deleting the project"
    );
  }

  return new ApiResponse(200, "Project deleted successfully", project).send(
    res
  );
});

// checked
const addMembersToProject = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const { email, projectRole }: addMemberInput = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  try {
    const member = await prisma.projectMember.upsert({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
      update: { projectRole: projectRole as ProjectRole },
      create: {
        userId: user.id,
        projectId,
        projectRole: projectRole as ProjectRole,
      },
    });

    return new ApiResponse(
      201,
      "Project member added successfully",
      member
    ).send(res);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new ApiError(400, "Invalid project Id or user Id");
      }
    }
    throw error;
  }
});

// checked
const getProjectMembers = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const projectMembers = await prisma.projectMember.findMany({
    where: {
      projectId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
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

// checked
const updateMemberRole = handleAsync(async (req, res) => {
  const { projectId, userId } = req.params;

  if (!ULID_REGEX.test(userId)) {
    throw new ApiError(400, "Invalid user Id");
  }

  const { projectRole }: updateMemberRoleInput = req.body;

  const updated = await prisma.projectMember.updateMany({
    where: { projectId, userId },
    data: { projectRole: projectRole as ProjectRole },
  });

  if (updated.count === 0) {
    throw new ApiError(404, "Project member not found");
  }

  return new ApiResponse(200, "Project member role updated successfully", {
    userId,
    projectRole,
  }).send(res);
});

// checked
const deleteMember = handleAsync(async (req, res) => {
  const { projectId, userId } = req.params;
  const ownerId = req.userId;

  if (!ULID_REGEX.test(userId)) {
    throw new ApiError(400, "Invalid user Id");
  }

  if (ownerId === userId) {
    throw new ApiError(401, "You can not delete owner of project");
  }

  const deleted = await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Project member not found");
  }

  return new ApiResponse(200, "Project member deleted successfully", {
    userId: userId,
    projectId: projectId,
  }).send(res);
});

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMembersToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
};

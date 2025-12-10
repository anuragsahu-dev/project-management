import prisma from "../db/prisma";
import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import { ProjectNoteInput } from "../schemas/projectNote.schema";
import logger from "../config/logger";

const listProjectNotes = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const projectNotes = await prisma.projectNote.findMany({
    where: {
      projectId,
    },
    include: {
      createdBy: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return new ApiResponse(
    200,
    "Project Notes fetched successfully",
    projectNotes
  ).send(res);
});

const createProjectNote = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const userId = req.userId;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const { content }: ProjectNoteInput = req.body;

  const projectNote = await prisma.projectNote.create({
    data: {
      content,
      projectId,
      createdById: userId,
    },
  });

  logger.info(`Note created: ${projectNote.id} in project: ${projectId}`);

  return new ApiResponse(
    201,
    "Project note created successfully",
    projectNote
  ).send(res);
});

const getProjectNoteById = handleAsync(async (req, res) => {
  const { projectId, noteId } = req.params;

  const projectNote = await prisma.projectNote.findFirst({
    where: {
      id: noteId,
      projectId,
    },
    include: {
      createdBy: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
  });

  if (!projectNote) {
    throw new ApiError(404, "Project note not found");
  }

  return new ApiResponse(
    200,
    "Project Note fetched successfully",
    projectNote
  ).send(res);
});

const updateProjectNote = handleAsync(async (req, res) => {
  const { projectId, noteId } = req.params;

  const { content }: ProjectNoteInput = req.body;

  const existingNote = await prisma.projectNote.findFirst({
    where: { id: noteId, projectId },
  });

  if (!existingNote) {
    throw new ApiError(404, "Project Note not found");
  }

  const updatedNote = await prisma.projectNote.update({
    where: {
      id: noteId,
    },
    data: {
      content,
    },
  });

  logger.info(`Note updated: ${noteId}`);

  return new ApiResponse(
    200,
    "Project Note updated successfully",
    updatedNote
  ).send(res);
});

const deleteProjectNote = handleAsync(async (req, res) => {
  const { projectId, noteId } = req.params;

  const projectNote = await prisma.projectNote.findFirst({
    where: {
      id: noteId,
      projectId,
    },
  });

  if (!projectNote) {
    throw new ApiError(404, "Project note not found");
  }

  await prisma.projectNote.delete({
    where: {
      id: noteId,
    },
  });

  logger.info(`Note deleted: ${noteId}`);

  return new ApiResponse(200, "Project note deleted successfully").send(res);
});

export {
  listProjectNotes,
  createProjectNote,
  getProjectNoteById,
  updateProjectNote,
  deleteProjectNote,
};

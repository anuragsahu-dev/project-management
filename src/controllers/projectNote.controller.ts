import prisma from "../db/prisma";
import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import { projectNoteInput } from "../validators/projectNoteValidation";

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

  const { content }: projectNoteInput = req.body;

  const projectNote = await prisma.projectNote.create({
    data: {
      content,
      projectId,
      createdById: userId,
    },
  });

  return new ApiResponse(
    201,
    "Project note created successfully",
    projectNote
  ).send(res);
});

const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

const getProjectNoteById = handleAsync(async (req, res) => {
  const { projectId, noteId } = req.params;

  if (!ULID_REGEX.test(noteId)) {
    throw new ApiError(400, "Invalid Note Id");
  }

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

  if (!ULID_REGEX.test(noteId)) {
    throw new ApiError(400, "Invalid Note Id");
  }

  const { content }: projectNoteInput = req.body;

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

  return new ApiResponse(
    200,
    "Project Note updated successfully",
    updatedNote
  ).send(res);
});

const deleteProjectNote = handleAsync(async (req, res) => {
  const { projectId, noteId } = req.params;

  if (!ULID_REGEX.test(noteId)) {
    throw new ApiError(400, "Invalid Note Id");
  }

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

  return new ApiResponse(200, "Project note deleted successfully").send(res);
});

export {
  listProjectNotes,
  createProjectNote,
  getProjectNoteById,
  updateProjectNote,
  deleteProjectNote,
};

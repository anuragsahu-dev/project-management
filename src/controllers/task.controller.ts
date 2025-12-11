import { Status } from "@prisma/client";
import prisma from "../db/prisma";
import { handleAsync, ApiError } from "../middlewares/error.middleware";
import logger from "../config/logger";
import { ApiResponse } from "../utils/apiResponse";
import {
  attachmentsSchema,
  CreateSubTaskInput,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateSubTaskInput,
} from "../schemas/task.schema";
import { deleteFile } from "../utils/cloudinary";
import { getValidatedBody, getValidatedParams } from "../types/express";

// completed
const getTasks = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: {
          id: true,
          avatar: true,
          fullName: true,
          email: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          avatar: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return new ApiResponse(200, "Tasks fetched successfully", tasks).send(res);
});

// completed
const createTask = handleAsync(async (req, res) => {
  const { projectId } = getValidatedParams<{ projectId: string }>(req);
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { title, description, status, assignedToId, attachments } =
    getValidatedBody<CreateTaskInput>(req);

  if (assignedToId) {
    const assignedTo = await prisma.user.findUnique({
      where: { id: assignedToId },
      include: {
        projectMemberships: {
          where: { projectId },
          select: { id: true },
        },
      },
    });

    if (!assignedTo || assignedTo.projectMemberships.length === 0) {
      throw new ApiError(404, "Assigned user is not a member of this project");
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assignedToId: assignedToId ?? null,
      status: status as Status,
      assignedById: userId,
      attachments,
    },
  });

  logger.info(`Task created: ${task.id} in project: ${projectId}`);

  return new ApiResponse(201, "Task created successfully", task).send(res);
});

// completed
const getTaskById = handleAsync(async (req, res) => {
  const { taskId, projectId } = getValidatedParams<{
    taskId: string;
    projectId: string;
  }>(req);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          email: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          email: true,
        },
      },
      subTasks: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return new ApiResponse(200, "Task fetched successfully", task).send(res);
});

// completed
const updateTask = handleAsync(async (req, res) => {
  const { taskId, projectId } = getValidatedParams<{
    taskId: string;
    projectId: string;
  }>(req);

  const { title, description, status, assignedToId, attachments } =
    getValidatedBody<UpdateTaskInput>(req);

  if (assignedToId) {
    const assignedTo = await prisma.user.findUnique({
      where: { id: assignedToId },
      include: {
        projectMemberships: {
          where: { projectId },
          select: { id: true },
        },
      },
    });

    if (!assignedTo || assignedTo.projectMemberships.length === 0) {
      throw new ApiError(404, "Assigned user is not a member of this project");
    }
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });
  if (!task) {
    throw new ApiError(404, "Task not found for this project");
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      title,
      description,
      ...(assignedToId !== undefined && { assignedToId }),
      ...(attachments && attachments.length !== 0 && { attachments }),
      status: status as Status,
    },
  });

  logger.info(`Task updated: ${taskId} in project: ${projectId}`);

  return new ApiResponse(200, "Task updated successfully", updatedTask).send(
    res
  );
});

// completed
const deleteTask = handleAsync(async (req, res) => {
  const { projectId, taskId } = getValidatedParams<{
    projectId: string;
    taskId: string;
  }>(req);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
  });

  if (!task) {
    throw new ApiError(404, "Task not found for this project");
  }

  const attachments = attachmentsSchema.parse(task.attachments ?? []);

  await prisma.task.delete({ where: { id: taskId } });

  if (attachments.length > 0) {
    for (const attachment of attachments) {
      await deleteFile(attachment.public_id, attachment.mimetype);
    }
  }

  logger.info(`Task deleted: ${taskId} from project: ${projectId}`);

  return new ApiResponse(200, "Task deleted successfully").send(res);
});

// completed
const createSubTask = handleAsync(async (req, res) => {
  const { projectId, taskId } = getValidatedParams<{
    projectId: string;
    taskId: string;
  }>(req);
  const userId = req.userId;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const { title } = getValidatedBody<CreateSubTaskInput>(req);

  const subTask = await prisma.subTask.create({
    data: {
      title,
      isCompleted: false,
      createdById: userId,
      taskId,
    },
    include: {
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  logger.info(`Subtask created: ${subTask.id} in task: ${taskId}`);

  return new ApiResponse(201, "Subtask created successfully", subTask).send(
    res
  );
});

// completed
const updateSubTask = handleAsync(async (req, res) => {
  const userId = req.userId;
  const { projectId, subTaskId } = getValidatedParams<{
    projectId: string;
    subTaskId: string;
  }>(req);

  const subTask = await prisma.subTask.findFirst({
    where: { id: subTaskId, task: { projectId } },
  });

  if (!subTask) throw new ApiError(404, "Subtask not found");

  if (subTask.createdById !== userId) {
    throw new ApiError(403, "Forbidden");
  }

  const { title, isCompleted } = getValidatedBody<UpdateSubTaskInput>(req);

  const updatedSubTask = await prisma.subTask.update({
    where: {
      id: subTaskId,
    },
    data: {
      title,
      isCompleted,
    },
  });

  logger.info(`Subtask updated: ${subTaskId}`);

  return new ApiResponse(
    200,
    "SubTask updated successfully",
    updatedSubTask
  ).send(res);
});

// completed
const deleteSubTask = handleAsync(async (req, res) => {
  const { projectId, subTaskId } = getValidatedParams<{
    projectId: string;
    subTaskId: string;
  }>(req);

  const subTask = await prisma.subTask.findFirst({
    where: { id: subTaskId, task: { projectId } },
  });

  if (!subTask) throw new ApiError(404, "Subtask not found");

  const deletedSubTask = await prisma.subTask.delete({
    where: { id: subTaskId },
    include: {
      createdBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  logger.info(`Subtask deleted: ${subTaskId}`);

  return new ApiResponse(
    200,
    "Subtask deleted successfully",
    deletedSubTask
  ).send(res);
});

export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};

import { Status } from "@prisma/client";
import prisma from "../db/prisma";
import { handleAsync, ApiError } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import {
  createSubTaskInput,
  taskInput,
  updateSubTaskInput,
} from "../validators/taskValidation";
import { deleteFile } from "../utils/cloudinary";

const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

// completed
const getTasks = handleAsync(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: {
          id: true,
          avatar: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          avatar: true,
          fullName: true,
          username: true,
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
  const { projectId } = req.params;
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { title, description, status, assignedToId, attachments }: taskInput =
    req.body;

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

  return new ApiResponse(201, "Task created successfully", task).send(res);
});

// completed
const getTaskById = handleAsync(async (req, res) => {
  const { taskId, projectId } = req.params;

  if (!ULID_REGEX.test(taskId)) {
    throw new ApiError(400, "Invalid Task Id");
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          email: true,
        },
      },
      subTasks: {
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
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
  const { taskId, projectId } = req.params;

  if (!ULID_REGEX.test(taskId)) {
    throw new ApiError(400, "Invalid Task Id");
  }

  const { title, description, status, assignedToId, attachments }: taskInput =
    req.body;

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
      assignedToId: assignedToId ?? task.assignedToId,
      status: status as Status,
      attachments,
    },
  });

  return new ApiResponse(200, "Task updated successfully", updatedTask).send(
    res
  );
});

type Attachment = {
  url: string;
  mimetype: string;
  size: number;
  public_id: string;
};

// completed
const deleteTask = handleAsync(async (req, res) => {
  const { projectId, taskId } = req.params;

  if (!ULID_REGEX.test(taskId)) {
    throw new ApiError(400, "Invalid Task Id");
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
  });

  if (!task) {
    throw new ApiError(404, "Task not found for this project");
  }

  const attachments = Array.isArray(task.attachments)
    ? (task.attachments as Attachment[])
    : [];

  if (attachments.length > 0) {
    for (const attachment of attachments) {
      await deleteFile(attachment.public_id, attachment.mimetype);
    }
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });

  return new ApiResponse(200, "Task deleted successfully").send(res);
});

// completed
const createSubTask = handleAsync(async (req, res) => {
  const { projectId, taskId } = req.params;
  const userId = req.userId;

  if (!userId) throw new ApiError(401, "Unauthorized");

  if (!ULID_REGEX.test(taskId)) {
    throw new ApiError(400, "Invalid Task Id");
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const { title }: createSubTaskInput = req.body;

  const subTask = await prisma.subTask.create({
    data: {
      title,
      isCompleted: false,
      createdById: userId,
      taskId,
    },
    include: {
      createdBy: { select: { id: true, username: true, fullName: true } },
    },
  });

  return new ApiResponse(201, "Subtask created successfully", subTask).send(
    res
  );
});

// completed
const updateSubTask = handleAsync(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  if (!ULID_REGEX.test(subTaskId)) {
    throw new ApiError(400, "Invalid Subtask Id");
  }

  const subTask = await prisma.subTask.findFirst({
    where: { id: subTaskId, task: { projectId } },
  });

  if (!subTask) throw new ApiError(404, "Subtask not found");

  const { title, isCompleted }: updateSubTaskInput = req.body;

  const updatedSubTask = await prisma.subTask.update({
    where: {
      id: subTaskId,
    },
    data: {
      title,
      isCompleted,
    },
  });

  return new ApiResponse(
    200,
    "SubTask updated successfully",
    updatedSubTask
  ).send(res);
});

// completed
const deleteSubTask = handleAsync(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  if (!ULID_REGEX.test(subTaskId)) {
    throw new ApiError(400, "Invalid Subtask Id");
  }

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
          username: true,
        },
      },
    },
  });

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

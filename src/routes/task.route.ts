import { Router } from "express";
import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware";
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
} from "../controllers/task.controller";
import { ProjectRole } from "@prisma/client";
import { validateData } from "../middlewares/validate.middleware";
import {
  createSubTaskSchema,
  taskSchema,
  updateSubTaskSchema,
} from "../validators/taskValidation";

const router = Router();

router.use(verifyJWT);

router.get(
  "/:projectId",
  validateProjectPermission(Object.values(ProjectRole)),
  getTasks
);

router.post(
  "/:projectId",
  validateProjectPermission([ProjectRole.MANAGER, ProjectRole.OWNER]),
  validateData(taskSchema),
  createTask
);

router.get(
  "/:projectId/t/:taskId",
  validateProjectPermission(Object.values(ProjectRole)),
  getTaskById
);

router.put(
  "/:projectId/t/:taskId",
  validateProjectPermission([ProjectRole.MANAGER, ProjectRole.OWNER]),
  validateData(taskSchema),
  updateTask
);

router.delete(
  "/:projectId/t/:taskId",
  validateProjectPermission([ProjectRole.OWNER, ProjectRole.MANAGER]),
  deleteTask
);

router.post(
  "/:projectId/t/:taskId/subtasks",
  validateProjectPermission([ProjectRole.MANAGER, ProjectRole.OWNER]),
  validateData(createSubTaskSchema),
  createSubTask
);

router.put(
  "/:projectId/st/:subTaskId",
  validateProjectPermission(Object.values(ProjectRole)),
  validateData(updateSubTaskSchema),
  updateSubTask
);

router.delete(
  "/:projectId/st/:subTaskId",
  validateProjectPermission([ProjectRole.OWNER, ProjectRole.MANAGER]),
  deleteSubTask
);

export default router;

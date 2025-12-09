import { Router } from "express";
import {
  validateProjectPermission,
  verifyJWT,
  validateTaskPermission,
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
  validateTaskPermission("view"),
  getTasks
);

router.post(
  "/:projectId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validateTaskPermission("create"),
  validateData(taskSchema),
  createTask
);

router.get(
  "/:projectId/t/:taskId",
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTaskById
);

router.put(
  "/:projectId/t/:taskId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.TEAM_MEMBER,
  ]),
  validateTaskPermission("update"),
  validateData(taskSchema),
  updateTask
);

router.delete(
  "/:projectId/t/:taskId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validateTaskPermission("delete"),
  deleteTask
);

router.post(
  "/:projectId/t/:taskId/subtasks",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.TEAM_MEMBER, // controller will restrict team member
  ]),
  validateTaskPermission("update"),
  validateData(createSubTaskSchema),
  createSubTask
);

router.put(
  "/:projectId/st/:subTaskId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.TEAM_MEMBER,
  ]),
  validateTaskPermission("update"),
  validateData(updateSubTaskSchema),
  updateSubTask
);

router.delete(
  "/:projectId/st/:subTaskId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validateTaskPermission("delete"),
  deleteSubTask
);

export default router;

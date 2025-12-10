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
import { validate } from "../middlewares/validate.middleware";
import {
  createSubTaskSchema,
  createTaskSchema,
  updateTaskSchema,
  updateSubTaskSchema,
} from "../schemas/task.schema";
import {
  projectIdParamsSchema,
  projectIdAndTaskIdParamsSchema,
  projectIdAndSubTaskIdParamsSchema,
} from "../schemas/request/params.schema";

const router = Router();

router.use(verifyJWT);

router.get(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTasks
);

router.post(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validateTaskPermission("create"),
  validate({ body: createTaskSchema }),
  createTask
);

router.get(
  "/:projectId/t/:taskId",
  validate({ params: projectIdAndTaskIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTaskById
);

router.put(
  "/:projectId/t/:taskId",
  validate({ params: projectIdAndTaskIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.TEAM_MEMBER,
  ]),
  validateTaskPermission("update"),
  validate({ body: updateTaskSchema }),
  updateTask
);

router.delete(
  "/:projectId/t/:taskId",
  validate({ params: projectIdAndTaskIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validateTaskPermission("delete"),
  deleteTask
);

router.post(
  "/:projectId/t/:taskId/subtasks",
  validate({ params: projectIdAndTaskIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.TEAM_MEMBER,
  ]),
  validateTaskPermission("update"),
  validate({ body: createSubTaskSchema }),
  createSubTask
);

router.put(
  "/:projectId/st/:subTaskId",
  validate({ params: projectIdAndSubTaskIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.TEAM_MEMBER,
  ]),
  validateTaskPermission("update"),
  validate({ body: updateSubTaskSchema }),
  updateSubTask
);

router.delete(
  "/:projectId/st/:subTaskId",
  validate({ params: projectIdAndSubTaskIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validateTaskPermission("delete"),
  deleteSubTask
);

export default router;

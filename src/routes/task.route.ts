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

/**
 * @swagger
 * /api/v1/tasks/{projectId}:
 *   get:
 *     summary: Get all tasks in a project
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Tasks retrieved successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | Admins cannot modify tasks"
 */
router.get(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTasks
);

/**
 * @swagger
 * /api/v1/tasks/{projectId}:
 *   post:
 *     summary: Create a new task (Head/Manager only)
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *               assignedToId:
 *                 type: string
 *     responses:
 *       201:
 *         description: "Task created successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | Only project manager or head can create tasks"
 *       404:
 *         description: "Assigned user is not a member of this project"
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/t/{taskId}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Task details retrieved"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | Admins cannot modify tasks"
 *       404:
 *         description: "Task not found"
 */
router.get(
  "/:projectId/t/:taskId",
  validate({ params: projectIdAndTaskIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTaskById
);

/**
 * @swagger
 * /api/v1/tasks/{projectId}/t/{taskId}:
 *   put:
 *     summary: Update task (Head/Manager or assigned Team Member)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *               assignedToId:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Task updated successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | You cannot update this task | Admins cannot modify tasks"
 *       404:
 *         description: "Task not found | Assigned user is not a member of this project"
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/t/{taskId}:
 *   delete:
 *     summary: Delete task (Head/Manager only)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Task deleted successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | You do not have permission to delete tasks | Admins cannot modify tasks"
 *       404:
 *         description: "Task not found"
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/t/{taskId}/subtasks:
 *   post:
 *     summary: Create a subtask
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: "Subtask created successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | You cannot update this task | Admins cannot modify tasks"
 *       404:
 *         description: "Task not found"
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/st/{subTaskId}:
 *   put:
 *     summary: Update subtask (Head/Manager or assigned Team Member)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subTaskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: "Subtask updated successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | You cannot update this task | Admins cannot modify tasks | Forbidden"
 *       404:
 *         description: "Task not found | Subtask not found"
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/st/{subTaskId}:
 *   delete:
 *     summary: Delete subtask (Head/Manager only)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subTaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Subtask deleted successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | You do not have permission to delete tasks | Admins cannot modify tasks"
 *       404:
 *         description: "Task not found | Subtask not found"
 */
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

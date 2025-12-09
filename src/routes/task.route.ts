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

/**
 * @swagger
 * components:
 *   schemas:
 *     TaskAttachment:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *         mimetype:
 *           type: string
 *         size:
 *           type: number
 *         public_id:
 *           type: string
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TaskAttachment'
 *         assignedToId:
 *           type: string
 *     CreateTask:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - status
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TaskAttachment'
 *         assignedToId:
 *           type: string
 *     CreateSubTask:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *     UpdateSubTask:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         isCompleted:
 *           type: boolean
 */

router.use(verifyJWT);

/**
 * @swagger
 * /api/v1/tasks/{projectId}:
 *   get:
 *     summary: Get tasks for a project
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
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get(
  "/:projectId",
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTasks
);

/**
 * @swagger
 * /api/v1/tasks/{projectId}:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
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
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
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
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
router.get(
  "/:projectId/t/:taskId",
  validateProjectPermission(Object.values(ProjectRole)),
  validateTaskPermission("view"),
  getTaskById
);

/**
 * @swagger
 * /api/v1/tasks/{projectId}/t/{taskId}:
 *   put:
 *     summary: Update task
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
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       200:
 *         description: Task updated
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/t/{taskId}:
 *   delete:
 *     summary: Delete task
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
 *         description: Task deleted
 */
router.delete(
  "/:projectId/t/:taskId",
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
 *     summary: Create subtask
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
 *             $ref: '#/components/schemas/CreateSubTask'
 *     responses:
 *       201:
 *         description: Subtask created
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/st/{subTaskId}:
 *   put:
 *     summary: Update subtask
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
 *             $ref: '#/components/schemas/UpdateSubTask'
 *     responses:
 *       200:
 *         description: Subtask updated
 */
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

/**
 * @swagger
 * /api/v1/tasks/{projectId}/st/{subTaskId}:
 *   delete:
 *     summary: Delete subtask
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
 *         description: Subtask deleted
 */
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

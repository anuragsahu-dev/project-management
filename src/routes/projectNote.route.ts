import { Router } from "express";
import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware";
import { ProjectRole } from "@prisma/client";
import {
  createProjectNote,
  deleteProjectNote,
  getProjectNoteById,
  listProjectNotes,
  updateProjectNote,
} from "../controllers/projectNote.controller";
import { projectNoteSchema } from "../schemas/projectNote.schema";
import { validate } from "../middlewares/validate.middleware";
import { projectIdParamsSchema } from "../schemas/request/params.schema";
import { projectNoteParamsSchema } from "../schemas/request/noteParams.schema";

const router = Router();

/**
 * @swagger
 * /api/v1/notes/{projectId}:
 *   get:
 *     summary: Get all notes for a project
 *     tags: [Notes]
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
 *         description: "Notes retrieved successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project"
 */
router.get(
  "/:projectId",
  verifyJWT,
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  listProjectNotes
);

/**
 * @swagger
 * /api/v1/notes/{projectId}:
 *   post:
 *     summary: Create a project note (Head/Manager only)
 *     tags: [Notes]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: "Note created successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action"
 */
router.post(
  "/:projectId",
  verifyJWT,
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validate({ body: projectNoteSchema }),
  createProjectNote
);

/**
 * @swagger
 * /api/v1/notes/{projectId}/n/{noteId}:
 *   get:
 *     summary: Get note by ID
 *     tags: [Notes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Note details retrieved"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project"
 *       404:
 *         description: "Project note not found"
 */
router.get(
  "/:projectId/n/:noteId",
  verifyJWT,
  validate({ params: projectNoteParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectNoteById
);

/**
 * @swagger
 * /api/v1/notes/{projectId}/n/{noteId}:
 *   put:
 *     summary: Update note (Head/Manager only)
 *     tags: [Notes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: noteId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Note updated successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action"
 *       404:
 *         description: "Project Note not found"
 */
router.put(
  "/:projectId/n/:noteId",
  verifyJWT,
  validate({ params: projectNoteParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  validate({ body: projectNoteSchema }),
  updateProjectNote
);

/**
 * @swagger
 * /api/v1/notes/{projectId}/n/{noteId}:
 *   delete:
 *     summary: Delete note (Head/Manager only)
 *     tags: [Notes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Note deleted successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action"
 *       404:
 *         description: "Project note not found"
 */
router.delete(
  "/:projectId/n/:noteId",
  verifyJWT,
  validate({ params: projectNoteParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  deleteProjectNote
);

export default router;

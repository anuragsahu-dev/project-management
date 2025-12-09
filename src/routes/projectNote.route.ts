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

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectNote:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         projectId:
 *           type: string
 *         createdAt:
 *           type: string
 *     CreateProjectNote:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           minLength: 10
 */

/**
 * @swagger
 * /api/v1/notes/{projectId}:
 *   get:
 *     summary: List project notes
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
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectNote'
 */
router.get(
  "/:projectId",
  verifyJWT,
  validateProjectPermission(Object.values(ProjectRole)),
  listProjectNotes
);

/**
 * @swagger
 * /api/v1/notes/{projectId}:
 *   post:
 *     summary: Create project note
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
 *             $ref: '#/components/schemas/CreateProjectNote'
 *     responses:
 *       201:
 *         description: Note created
 */
router.post(
  "/:projectId",
  verifyJWT,
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  createProjectNote
);

/**
 * @swagger
 * /api/v1/notes/{projectId}/n/{noteId}:
 *   get:
 *     summary: Get project note by ID
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
 *         description: Note details
 */
router.get(
  "/:projectId/n/:noteId",
  verifyJWT,
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectNoteById
);

/**
 * @swagger
 * /api/v1/notes/{projectId}/n/{noteId}:
 *   put:
 *     summary: Update project note
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
 *             $ref: '#/components/schemas/CreateProjectNote'
 *     responses:
 *       200:
 *         description: Note updated
 */
router.put(
  "/:projectId/n/:noteId",
  verifyJWT,
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  updateProjectNote
);

/**
 * @swagger
 * /api/v1/notes/{projectId}/n/{noteId}:
 *   delete:
 *     summary: Delete project note
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
 *         description: Note deleted
 */
router.delete(
  "/:projectId/n/:noteId",
  verifyJWT,
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  deleteProjectNote
);

export default router;

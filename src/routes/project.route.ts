import { Router } from "express";
import { validateData } from "../middlewares/validate.middleware";
import {
  authorizedRoles,
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware";
import {
  getMyProjects,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  updateProject,
  addTeamMemberToProject,
  assignProjectManager,
  getProjects,
} from "../controllers/project.controller";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/projectValidation";
import { ProjectRole, Role } from "@prisma/client";
import { emailSchema } from "../validators/userValidation";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         displayName:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateProject:
 *       type: object
 *       required:
 *         - displayName
 *       properties:
 *         displayName:
 *           type: string
 *           minLength: 6
 *         description:
 *           type: string
 *           minLength: 10
 *     UpdateProject:
 *       type: object
 *       properties:
 *         displayName:
 *           type: string
 *         description:
 *           type: string
 *     ProjectMemberEmail:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 */

router.use(verifyJWT);

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get my projects
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of projects I belong to
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get("/", getMyProjects);

/**
 * @swagger
 * /api/v1/projects/all:
 *   get:
 *     summary: Get all projects (Admin only)
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       403:
 *         description: Forbidden
 */
router.get(
  "/all",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  getProjects
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 */
router.get(
  "/:projectId",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectById
);

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     description: Admin/SuperAdmin only
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProject'
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 */
router.post(
  "/",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(createProjectSchema),
  createProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   put:
 *     summary: Update project details
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
 *             $ref: '#/components/schemas/UpdateProject'
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put(
  "/:projectId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(updateProjectSchema),
  updateProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
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
 *         description: Project deleted
 */
router.delete(
  "/:projectId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  deleteProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members:
 *   post:
 *     summary: Add member to project
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
 *             $ref: '#/components/schemas/ProjectMemberEmail'
 *     responses:
 *       200:
 *         description: Member added
 */
router.post(
  "/:projectId/members",
  validateProjectPermission(Object.values(ProjectRole)),
  validateData(emailSchema),
  addTeamMemberToProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/assign-manager:
 *   post:
 *     summary: Assign project manager
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
 *             $ref: '#/components/schemas/ProjectMemberEmail'
 *     responses:
 *       200:
 *         description: Manager assigned
 */
router.post(
  "/:projectId/assign-manager",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(emailSchema),
  assignProjectManager
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members:
 *   get:
 *     summary: Get project members
 *     tags: [Projects]
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
 *         description: List of members
 */
router.get(
  "/:projectId/members",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectMembers
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Remove member from project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete(
  "/:projectId/members/:userId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  deleteMember
);

export default router;

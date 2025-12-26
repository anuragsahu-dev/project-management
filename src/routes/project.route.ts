import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
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
} from "../schemas/project.schema";
import { ProjectRole, Role } from "../generated/prisma/client";
import { emailSchemaOnly } from "../schemas/user.schema";
import {
  projectIdParamsSchema,
  projectIdAndUserIdParamsSchema,
} from "../schemas/request/params.schema";
import { paginationQuerySchema } from "../schemas/request/pagination.schema";

const router = Router();

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
 *         description: "Projects fetched successfully"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.get("/", getMyProjects);

/**
 * @swagger
 * /api/v1/projects/all:
 *   get:
 *     summary: Get all projects with pagination (Admin only)
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: "Projects fetched successfully"
 *       400:
 *         description: "Invalid query parameters"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.get(
  "/all",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ query: paginationQuerySchema }),
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
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Project details fetched successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project"
 *       404:
 *         description: "Project not found"
 */
router.get(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectById
);

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: "Project created successfully"
 *       400:
 *         description: "Invalid request body | Unauthorized | Project with name already exists"
 *       401:
 *        description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.post(
  "/",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ body: createProjectSchema }),
  createProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   put:
 *     summary: Update project (Project Head only)
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
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Project updated successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id | Another project with this name already exists | No valid fields provided"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action"
 *       404:
 *         description: "Project not found"
 *       500:
 *         description: "Internal server error"
 */
router.put(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validate({ body: updateProjectSchema }),
  updateProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   delete:
 *     summary: Delete project (Project Head only)
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
 *         description: "Project deleted successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action"
 *       404:
 *         description: "Project not found"
 *       500:
 *         description: "Internal server error"
 */
router.delete(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  deleteProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members:
 *   post:
 *     summary: Add team member to project
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: "Team member added"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id | User is already a member | Admin cannot join projects"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project"
 *       404:
 *         description: "User does not exist | Project not found"
 */
router.post(
  "/:projectId/members",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  validate({ body: emailSchemaOnly }),
  addTeamMemberToProject
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/assign-manager:
 *   post:
 *     summary: Assign project manager (Project Head only)
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: "Project manager assigned successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid request body | Invalid Project Id | Only global MANAGER can be assigned"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action"
 *       404:
 *         description: "User does not exist | Project not found"
 */
router.post(
  "/:projectId/assign-manager",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validate({ body: emailSchemaOnly }),
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
 *         description: "Members fetched successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project"
 *       404:
 *         description: "Project not found"
 */
router.get(
  "/:projectId/members",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectMembers
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Remove member from project (Head/Manager only)
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
 *         description: "Member removed successfully"
 *       400:
 *         description: "Invalid URL parameters | Invalid Project Id"
 *       401:
 *         description: "Authentication failed. Please log in. | Unauthorized"
 *       403:
 *         description: "You are not a member of this project | You do not have permission to perform this action | Cannot remove the Project Head | Only Head can remove Manager | Manager can only remove Team Members"
 *       404:
 *         description: "Project member not found"
 */
router.delete(
  "/:projectId/members/:userId",
  validate({ params: projectIdAndUserIdParamsSchema }),
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  deleteMember
);

export default router;

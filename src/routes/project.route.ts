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
import { createProjectSchema, updateProjectSchema } from "../validators/projectValidation";
import { ProjectRole, Role } from "@prisma/client";
import { emailSchema } from "../validators/userValidation";

const router = Router();

router.use(verifyJWT);

router.get("/", getMyProjects);

router.get(
  "/:projectId",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectById
);

router.get(
  "/all",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  getProjects
);

router.post(
  "/",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(createProjectSchema),
  createProject
);

router.put(
  "/:projectId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(updateProjectSchema),
  updateProject
);

router.delete(
  "/:projectId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  deleteProject
);

router.post(
  "/:projectId/members",
  validateProjectPermission(Object.values(ProjectRole)),
  validateData(emailSchema),
  addTeamMemberToProject
);

router.post(
  "/:projectId/assign-manager",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(emailSchema),
  assignProjectManager
);

router.get(
  "/:projectId/members",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectMembers
);

router.delete(
  "/:projectId/members/:userId",
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  deleteMember
);

export default router;

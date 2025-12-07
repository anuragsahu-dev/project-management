import { Router } from "express";
import { validateData } from "../middlewares/validate.middleware";
import {
  authorizedRoles,
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware";
import {
  addMembersToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
} from "../controllers/project.controller";
import {
  projectSchema,
  updateMemberRoleSchema,
} from "../validators/projectValidation";
import { ProjectRole, Role } from "@prisma/client";
import { addMemberSchema } from "../validators/projectValidation";

const router = Router();

router.use(verifyJWT);

router.get("/", authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]), getProjects);

router.get(
  "/:projectId",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectById
);

router.put(
  "/:projectId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(projectSchema),
  updateProject
);

router.delete(
  "/:projectId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  deleteProject
);

router.get(
  "/:projectId/members",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectMembers
);

router.post(
  "/:projectId/members",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(addMemberSchema),
  addMembersToProject
);

router.put(
  "/:projectId/members/:userId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validateData(updateMemberRoleSchema),
  updateMemberRole
);

router.delete(
  "/:projectId/members/:userId",
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  deleteMember
);

export default router;

// all routes are working perfectly

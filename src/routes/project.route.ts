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

// all routes are secured in this router
router.use(verifyJWT);

// working
router.get("/", getProjects); // only who is part of that proect get that project details

// working
router.post(
  "/",
  authorizedRoles([Role.ADMIN]),
  validateData(projectSchema),
  createProject
); // only ADMIN can create the project

// working
router.get(
  "/:projectId",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectById
);

// working
router.put(
  "/:projectId",
  validateProjectPermission([ProjectRole.OWNER]),
  validateData(projectSchema),
  updateProject
);

// working
router.delete(
  "/:projectId",
  validateProjectPermission([ProjectRole.OWNER]),
  deleteProject
);

// working
router.get(
  "/:projectId/members",
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectMembers
); // only team members are allowed to get the information

// working
router.post(
  "/:projectId/members",
  validateProjectPermission([ProjectRole.OWNER]),
  validateData(addMemberSchema),
  addMembersToProject
);

// working
router.put(
  "/:projectId/members/:userId",
  validateProjectPermission([ProjectRole.OWNER]),
  validateData(updateMemberRoleSchema),
  updateMemberRole
);

// working
router.delete(
  "/:projectId/members/:userId",
  validateProjectPermission([ProjectRole.OWNER]),
  deleteMember
);

export default router;

// all routes are working perfectly

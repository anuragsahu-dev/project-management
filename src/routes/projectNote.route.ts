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

router.get(
  "/:projectId",
  verifyJWT,
  validateProjectPermission(Object.values(ProjectRole)),
  listProjectNotes
);

router.post(
  "/:projectId",
  verifyJWT,
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  createProjectNote
);

router.get(
  "/:projectId/n/:noteId",
  verifyJWT,
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectNoteById
);

router.put(
  "/:projectId/n/:noteId",
  verifyJWT,
  validateProjectPermission([
    ProjectRole.PROJECT_HEAD,
    ProjectRole.PROJECT_MANAGER,
  ]),
  updateProjectNote
);

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

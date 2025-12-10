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

router.get(
  "/:projectId",
  verifyJWT,
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  listProjectNotes
);

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

router.get(
  "/:projectId/n/:noteId",
  verifyJWT,
  validate({ params: projectNoteParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectNoteById
);

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

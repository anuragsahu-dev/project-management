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
import { ProjectRole, Role } from "@prisma/client";
import { emailSchemaOnly } from "../schemas/user.schema";
import {
  projectIdParamsSchema,
  projectIdAndUserIdParamsSchema,
} from "../schemas/request/params.schema";
import { paginationQuerySchema } from "../schemas/request/pagination.schema";

const router = Router();

router.use(verifyJWT);

router.get("/", getMyProjects);

router.get(
  "/all",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ query: paginationQuerySchema }),
  getProjects
);

router.get(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectById
);

router.post(
  "/",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ body: createProjectSchema }),
  createProject
);

router.put(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validate({ body: updateProjectSchema }),
  updateProject
);

router.delete(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  deleteProject
);

router.post(
  "/:projectId/members",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  validate({ body: emailSchemaOnly }),
  addTeamMemberToProject
);

router.post(
  "/:projectId/assign-manager",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission([ProjectRole.PROJECT_HEAD]),
  validate({ body: emailSchemaOnly }),
  assignProjectManager
);

router.get(
  "/:projectId/members",
  validate({ params: projectIdParamsSchema }),
  validateProjectPermission(Object.values(ProjectRole)),
  getProjectMembers
);

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

/*
registry.registerPath({
  method: "put",
  path: "/api/v1/projects/{projectId}",
  tags: ["Projects"],
  summary: "Update project details",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      projectId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateProjectSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Project updated",
      content: {
        "application/json": {
          schema: z.object({
            statusCode: z.number(),
            message: z.string(),
            success: z.boolean(),
            data: z.any(),
          }),
        },
      },
    },
  },
});
*/

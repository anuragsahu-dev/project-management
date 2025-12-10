import { Router } from "express";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  createAdmin,
  createManager,
  getAllUsers,
  promoteOrDemoteManager,
  updateUserStatus,
} from "../controllers/system.controller";
import { Role } from "@prisma/client";
import { validate } from "../middlewares/validate.middleware";
import {
  createSchema,
  passwordConfirmSchema,
  userStatusWithPasswordSchema,
  getAllUsersQuerySchema,
} from "../schemas/user.schema";
import { userIdParamsSchema } from "../schemas/request/params.schema";

const router = Router();

router.use(verifyJWT);

router.post(
  "/manager",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ body: createSchema }),
  createManager
);

router.post(
  "/admin",
  authorizedRoles([Role.SUPER_ADMIN]),
  validate({ body: createSchema }),
  createAdmin
);

router.put(
  "/manager/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ params: userIdParamsSchema, body: passwordConfirmSchema }),
  promoteOrDemoteManager
);

router.put(
  "/user/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ params: userIdParamsSchema, body: userStatusWithPasswordSchema }),
  updateUserStatus
);

router.get(
  "/",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ query: getAllUsersQuerySchema }),
  getAllUsers
);

export default router;

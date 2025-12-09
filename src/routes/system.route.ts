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
import { validateData } from "../middlewares/validate.middleware";
import { createSchema, passwordSchema } from "../validators/userValidation";

const router = Router();

router.use(verifyJWT);

router.post(
  "/manager",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(createSchema),
  createManager
);

router.post(
  "/admin",
  authorizedRoles([Role.SUPER_ADMIN]),
  validateData(createSchema),
  createAdmin
);

router.put(
  "/manager/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(passwordSchema),
  promoteOrDemoteManager
);

router.put(
  "/user/:userId",
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateData(passwordSchema),
  updateUserStatus
);

router.get("/", authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN]), getAllUsers);

export default router;

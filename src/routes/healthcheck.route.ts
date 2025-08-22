import { Router } from "express";
import {
  healthCheck
} from "../controllers/healthcheck.controller";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.get(
  "/full",
  verifyJWT,
  authorizedRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  healthCheck
);

export default router;

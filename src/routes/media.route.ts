import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  fileBulkUpload,
  uploadSingleFile,
} from "../controllers/media.controller";
import { Role } from "@prisma/client";


const router = Router();


router.post(
  "/file",
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  upload.single("file"),
  uploadSingleFile
);


router.post(
  "/files",
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  upload.array("files", 10),
  fileBulkUpload
);

export default router;

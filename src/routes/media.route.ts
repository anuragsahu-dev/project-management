import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  fileBulkUpload,
  uploadSingleFile,
} from "../controllers/media.controller";
import { Role } from "@prisma/client";

const router = Router();

router.post("/file", verifyJWT, upload.single("file"), uploadSingleFile);
router.post(
  "/files",
  verifyJWT,
  authorizedRoles([Role.ADMIN]),
  upload.array("files", 10),
  fileBulkUpload
);

export default router;

import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware";
import {
  fileBulkUpload,
  uploadSingleFile,
} from "../controllers/media.controller";
import { Role } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * /api/v1/upload/file:
 *   post:
 *     summary: Upload a single file (Admin/Manager only)
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: "File uploaded successfully"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.post(
  "/file",
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  upload.single("file"),
  uploadSingleFile
);

/**
 * @swagger
 * /api/v1/upload/files:
 *   post:
 *     summary: Upload multiple files (Admin/Manager only, max 10)
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: "Files uploaded successfully"
 *       401:
 *         description: "Authentication failed. Please log in."
 *       403:
 *         description: "Access Denied: Unauthorized route"
 */
router.post(
  "/files",
  verifyJWT,
  authorizedRoles([Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  upload.array("files", 10),
  fileBulkUpload
);

export default router;

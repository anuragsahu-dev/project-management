import multer from "multer";
import type { Options } from "multer";
import { ApiError } from "./error.middleware";

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, `./uploads/temp`);
  },
  filename: function (_req, file, cb) {
    const randomNumber = Math.round(Math.random() * 100);
    cb(null, `${Date.now() + randomNumber}-${file.originalname}`);
  },
});

const fileFilter: Options["fileFilter"] = (_req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only images, PDFs, and docs are allowed"));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 10 MB limit
  },
  fileFilter,
});
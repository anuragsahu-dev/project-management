import fs from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/config";
import { ApiError } from "../middlewares/error.middleware";
import logger from "../config/logger";

cloudinary.config({
  api_key: config.API_KEY,
  api_secret: config.API_SECRET,
  cloud_name: config.CLOUD_NAME,
});

export const uploadFileToCloudinary = async (localFilePath: string) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    try {
      await fs.unlink(localFilePath);
    } catch (error) {
      logger.warn("Failed to delete local file after upload", {
        localFilePath,
        error,
      });
    }

    return {
      fileId: uploadResponse.public_id,
      fileUrl: uploadResponse.secure_url,
      resourceType: uploadResponse.resource_type,
    };
  } catch (error) {
    try {
      await fs.unlink(localFilePath);
    } catch (err) {
      logger.warn("Failed to delete local file after failed upload", {
        localFilePath,
        err,
      });
    }
    logger.error("Cloudinary file upload failed", { localFilePath, error });
    throw new ApiError(500, "File upload failed");
  }
};

export const deleteFile = async (public_id: string, resource_type: string) => {
  try {
    await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });
  } catch (error) {
    logger.warn("Failed to delete Cloudinary file", {
      public_id,
      resource_type,
      error,
    });
  }
};

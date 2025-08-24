import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import { uploadFileToCloudinary } from "../utils/cloudinary";

const uploadSingleFile = handleAsync(async (req, res) => {
  const localFilePath = req.file?.path;

  if (!localFilePath) {
    throw new ApiError(400, "File is not present");
  }

  const result = await uploadFileToCloudinary(localFilePath);

  return new ApiResponse(200, "File uploaded successfully", result).send(res);
});

const fileBulkUpload = handleAsync(async (req, res) => {
  if (!req.files || !(req.files instanceof Array) || !req.files.length) {
    throw new ApiError(400, "Invalid credentials");
  }

  const results = await Promise.all(
    req.files.map((file) => uploadFileToCloudinary(file.path))
  );

  return new ApiResponse(200, "Files uploaded successfully", results).send(res);
});


export { uploadSingleFile, fileBulkUpload };

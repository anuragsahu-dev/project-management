import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { config } from "../config/config";
import { ApiError } from "../middlewares/error.middleware";
import logger from "../config/logger";

interface GenerateToken {
  accessToken: string;
  refreshToken: string;
}

interface Options {
  httpOnly: boolean;
  secure: boolean;
}

const cookieOptions: Options = {
  httpOnly: true,
  secure: true,
};

const generateAccessRefreshToken = async (
  id: string
): Promise<GenerateToken> => {
  try {
    const refreshToken = jwt.sign(
      {
        id,
      },
      config.auth.refreshTokenSecret,
      { expiresIn: config.auth.refreshTokenExpiry }
    );

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        refreshToken,
      },
    });

    const accessToken = jwt.sign(
      {
        id,
        role: user.role,
      },
      config.auth.accessTokenSecret,
      { expiresIn: config.auth.accessTokenExpiry }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Error generating access/refresh token", { error });
    throw new ApiError(
      500,
      "Something went wrong while generating access token"
    );
  }
};

export { cookieOptions, generateAccessRefreshToken };

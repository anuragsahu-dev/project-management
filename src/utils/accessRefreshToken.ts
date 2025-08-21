import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { config } from "../config/config";
import { ApiError } from "../middlewares/error.middleware";

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
      config.REFRESH_TOKEN_SECRET,
      { expiresIn: config.REFRESH_TOKEN_EXPIRY }
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
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: config.ACCESS_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  } catch (_error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token"
    );
  }
};

export { cookieOptions, generateAccessRefreshToken };

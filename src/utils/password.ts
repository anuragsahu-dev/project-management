import bcrypt from "bcrypt";
import logger from "../config/logger";

export const hashedPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const isPasswordValid = async (
  userPassword: string,
  dbPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(userPassword, dbPassword);
  } catch (error) {
    logger.error("Password comparison failed", { error });
    return false;
  }
};

import fs from "node:fs";
import dotenv from "dotenv";
dotenv.config();

type TokenExpiry = `${number}${"s" | "m" | "h" | "d"}`;

function getEnvVariable(key: string): string {
  const secretFilePath = process.env[`${key}_FILE`];
  if (secretFilePath && fs.existsSync(secretFilePath)) {
    return fs.readFileSync(secretFilePath, "utf8").trim();
  }

  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Environment variable "${key}" is not set`);
  return value;
}

const tokenExpiryRegex = /^\d+[smhd]$/;

function validateTokenExpiry(value: string): TokenExpiry {
  if (tokenExpiryRegex.test(value)) return value as TokenExpiry;
  throw new Error(`Invalid token expiry format: ${value}`);
}

export const config = {
  server: {
    port: Number(getEnvVariable("PORT")),
    nodeEnv: getEnvVariable("NODE_ENV"),
    clientUrl: getEnvVariable("CLIENT_URL"),
    internalPort: Number(getEnvVariable("INTERNAL_PORT")),
  },
  database: {
    url: getEnvVariable("DATABASE_URL"),
  },
  redis: {
    host: getEnvVariable("REDIS_HOST"),
    port: Number(getEnvVariable("REDIS_PORT")),
  },
  auth: {
    accessTokenSecret: getEnvVariable("ACCESS_TOKEN_SECRET"),
    refreshTokenSecret: getEnvVariable("REFRESH_TOKEN_SECRET"),
    accessTokenExpiry: validateTokenExpiry(
      getEnvVariable("ACCESS_TOKEN_EXPIRY")
    ),
    refreshTokenExpiry: validateTokenExpiry(
      getEnvVariable("REFRESH_TOKEN_EXPIRY")
    ),
    forgotPasswordRedirectUrl: getEnvVariable("FORGOT_PASSWORD_REDIRECT_URL"),
  },
  smtp: {
    host: getEnvVariable("SMTP_HOST"),
    port: Number(getEnvVariable("SMTP_PORT")),
    user: getEnvVariable("SMTP_USER"),
    pass: getEnvVariable("SMTP_PASS"),
  },
  cloudinary: {
    cloudName: getEnvVariable("CLOUDINARY_CLOUD_NAME"),
    apiKey: getEnvVariable("CLOUDINARY_API_KEY"),
    apiSecret: getEnvVariable("CLOUDINARY_API_SECRET"),
  },
} as const;

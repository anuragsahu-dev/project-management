import fs from "node:fs";
import dotenv from "dotenv";
dotenv.config();

type TokenExpiry = `${number}${"s" | "m" | "h" | "d"}`;

interface Config {
  PORT: number;
  NODE_ENV: string;
  CLIENT_URL: string;
  DATABASE_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRY: TokenExpiry;
  REFRESH_TOKEN_EXPIRY: TokenExpiry;
  FORGOT_PASSWORD_REDIRECT_URL: string;
  INTERNAL_PORT: number;
  CLOUD_NAME: string;
  API_KEY: string;
  API_SECRET: string;
}

function getEnvVariable(key: string): string {
  const secretFilePath = process.env[`${key}_FILE`];
  if (secretFilePath && fs.existsSync(secretFilePath)) {
    return fs.readFileSync(secretFilePath, "utf8").trim();
  }
  const value = process.env[key];
  if (value) {
    return value;
  }
  throw new Error(`Environment variable "${key}" is not set`);
}

export const config: Config = {
  PORT: Number(getEnvVariable("PORT")),
  NODE_ENV: getEnvVariable("NODE_ENV"),
  CLIENT_URL: getEnvVariable("CLIENT_URL"),
  DATABASE_URL: getEnvVariable("DATABASE_URL"),
  SMTP_HOST: getEnvVariable("SMTP_HOST"),
  SMTP_PORT: Number(getEnvVariable("SMTP_PORT")),
  SMTP_USER: getEnvVariable("SMTP_USER"),
  SMTP_PASS: getEnvVariable("SMTP_PASS"),
  ACCESS_TOKEN_SECRET: getEnvVariable("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET: getEnvVariable("REFRESH_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRY: getEnvVariable("ACCESS_TOKEN_EXPIRY") as TokenExpiry,
  REFRESH_TOKEN_EXPIRY: getEnvVariable("REFRESH_TOKEN_EXPIRY") as TokenExpiry,
  FORGOT_PASSWORD_REDIRECT_URL: getEnvVariable("FORGOT_PASSWORD_REDIRECT_URL"),
  INTERNAL_PORT: Number(getEnvVariable("INTERNAL_PORT")),
  CLOUD_NAME: getEnvVariable("CLOUDINARY_CLOUD_NAME"),
  API_KEY: getEnvVariable("CLOUDINARY_API_KEY"),
  API_SECRET: getEnvVariable("CLOUDINARY_API_SECRET"),
};

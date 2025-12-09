import { z } from "zod";
import { email } from "./userValidation";

const projectName = z
  .string()
  .trim()
  .min(6, "Project name must be at least 6 characters")
  .max(80, "Project name must not exceed 80 characters");

const projectDescription = z
  .string()
  .trim()
  .min(10, "Project description must be at least 10 characters")
  .max(2000, "Project description must not exceed 2000 characters");

const projectRole = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val) => ["PROJECT_MANAGER", "TEAM_MEMBER"].includes(val), {
    message:
      "Invalid project role. Allowed values: PROJECT_MANAGER and TEAM_MEMBER",
  });

export const createProjectSchema = z.object({
  displayName: projectName,
  description: projectDescription.default("No description provided"),
});

export type createProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  displayName: projectName.optional(),
  description: projectDescription.optional(),
});

export type updateProjectInput = z.infer<typeof updateProjectSchema>;

export const addMemberSchema = z.object({
  email,
  projectRole,
});

export type addMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  projectRole,
});

export type updateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

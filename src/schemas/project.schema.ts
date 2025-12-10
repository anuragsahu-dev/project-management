import { z } from "zod";
import { emailSchema } from "./common.schema";

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

const projectRoleEnum = z.enum(["PROJECT_MANAGER", "TEAM_MEMBER"]);

const projectRole = z.preprocess(
  (val) => (typeof val === "string" ? val.toUpperCase() : val),
  projectRoleEnum
);

export const createProjectSchema = z.object({
  displayName: projectName,
  description: projectDescription.default("No description provided"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    displayName: projectName.optional(),
    description: projectDescription.optional(),
  })
  .refine((data) => data.displayName || data.description, {
    message:
      "At least one field (displayName or description) must be provided for update",
  });
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addMemberSchema = z.object({
  email: emailSchema,
  projectRole,
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  projectRole,
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

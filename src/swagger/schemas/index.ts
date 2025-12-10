import { registry } from "../registry";

// Import all existing Zod schemas
import {
  registerUserSchema,
  loginUserSchema,
  emailSchemaOnly,
  resetForgotPasswordSchema,
  changeCurrentPasswordSchema,
  updateUserSchema,
  getAllUsersQuerySchema,
  createSchema,
  passwordConfirmSchema,
  userStatusWithPasswordSchema,
} from "../../schemas/user.schema";

import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from "../../schemas/project.schema";

import {
  createTaskSchema,
  updateTaskSchema,
  createSubTaskSchema,
  updateSubTaskSchema,
} from "../../schemas/task.schema";

import { projectNoteSchema } from "../../schemas/projectNote.schema";

import {
  userIdParamsSchema,
  taskIdParamsSchema,
  projectIdParamsSchema,
  subTaskIdParamsSchema,
  projectIdAndTaskIdParamsSchema,
  projectIdAndSubTaskIdParamsSchema,
  projectIdAndUserIdParamsSchema,
} from "../../schemas/request/params.schema";

import { paginationQuerySchema } from "../../schemas/request/pagination.schema";

import {
  noteIdParamsSchema,
  projectNoteParamsSchema,
} from "../../schemas/request/noteParams.schema";

// Register User Schemas
registry.register("RegisterUserSchema", registerUserSchema);
registry.register("LoginUserSchema", loginUserSchema);
registry.register("EmailOnlySchema", emailSchemaOnly);
registry.register("ResetPasswordSchema", resetForgotPasswordSchema);
registry.register("ChangePasswordSchema", changeCurrentPasswordSchema);
registry.register("UpdateUserSchema", updateUserSchema);
registry.register("GetAllUsersQuerySchema", getAllUsersQuerySchema);
registry.register("CreateUserSchema", createSchema);
registry.register("PasswordConfirmSchema", passwordConfirmSchema);
registry.register("UserStatusWithPasswordSchema", userStatusWithPasswordSchema);

// Register Project Schemas
registry.register("CreateProjectSchema", createProjectSchema);
registry.register("UpdateProjectSchema", updateProjectSchema);
registry.register("AddMemberSchema", addMemberSchema);
registry.register("UpdateMemberRoleSchema", updateMemberRoleSchema);

// Register Task Schemas
registry.register("CreateTaskSchema", createTaskSchema);
registry.register("UpdateTaskSchema", updateTaskSchema);
registry.register("CreateSubTaskSchema", createSubTaskSchema);
registry.register("UpdateSubTaskSchema", updateSubTaskSchema);

// Register Note Schemas
registry.register("ProjectNoteSchema", projectNoteSchema);

// Register Param Schemas
registry.register("UserIdParams", userIdParamsSchema);
registry.register("TaskIdParams", taskIdParamsSchema);
registry.register("ProjectIdParams", projectIdParamsSchema);
registry.register("SubTaskIdParams", subTaskIdParamsSchema);
registry.register("ProjectIdAndTaskIdParams", projectIdAndTaskIdParamsSchema);
registry.register(
  "ProjectIdAndSubTaskIdParams",
  projectIdAndSubTaskIdParamsSchema
);
registry.register("ProjectIdAndUserIdParams", projectIdAndUserIdParamsSchema);
registry.register("NoteIdParams", noteIdParamsSchema);
registry.register("ProjectNoteParams", projectNoteParamsSchema);

// Register Query Schemas
registry.register("PaginationQuery", paginationQuerySchema);

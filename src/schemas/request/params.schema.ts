import { z } from "zod";
import { ulidSchema } from "../common.schema";

export const userIdParamsSchema = z.object({
  userId: ulidSchema,
});

export const taskIdParamsSchema = z.object({
  taskId: ulidSchema,
});

export const projectIdParamsSchema = z.object({
  projectId: ulidSchema,
});

export const subTaskIdParamsSchema = z.object({
  subTaskId: ulidSchema,
});

export const projectIdAndTaskIdParamsSchema = z.object({
  projectId: ulidSchema,
  taskId: ulidSchema,
});

export const projectIdAndSubTaskIdParamsSchema = z.object({
  projectId: ulidSchema,
  subTaskId: ulidSchema,
});

export const projectIdAndUserIdParamsSchema = z.object({
  projectId: ulidSchema,
  userId: ulidSchema,
});

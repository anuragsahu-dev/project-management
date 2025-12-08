import { Action, Role } from "@prisma/client";
import prisma from "../db/prisma";
import { ApiError, handleAsync } from "../middlewares/error.middleware";
import { ApiResponse } from "../utils/apiResponse";
import { createInput, passwordInput } from "../validators/userValidation";
import { isPasswordValid, hashedPassword } from "../utils/password";

const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

const createManager = handleAsync(async (req, res) => {
  const userId = req.userId;
  const { email, password, userPassword, fullName }: createInput = req.body;

  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { id: true, email: true, password: true },
  });

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const passwordValidate = await isPasswordValid(userPassword, user.password);
  if (!passwordValidate) {
    throw new ApiError(400, "Invalid Password");
  }

  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const hashedPasswordValue = await hashedPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        password: hashedPasswordValue,
        fullName,
        role: Role.MANAGER,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: user.id,
        targetUserId: createdUser.id,
        action: Action.CREATE_MANAGER,
      },
    });

    return createdUser;
  });

  return new ApiResponse(200, "Manager created successfully", result).send(res);
});

const createAdmin = handleAsync(async (req, res) => {
  const userId = req.userId;
  const { email, password, userPassword, fullName }: createInput = req.body;

  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { id: true, email: true, password: true },
  });

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const passwordValidate = await isPasswordValid(userPassword, user.password);
  if (!passwordValidate) {
    throw new ApiError(400, "Invalid Password");
  }

  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const hashedPasswordValue = await hashedPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        password: hashedPasswordValue,
        fullName,
        role: Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: user.id,
        targetUserId: createdUser.id,
        action: Action.CREATE_ADMIN,
      },
    });

    return createdUser;
  });

  return new ApiResponse(200, "Admin created successfully", result).send(res);
});

// admin or super admin can promote or demote user to manager
const promoteOrDemoteManager = handleAsync(async (req, res) => {
  const superAdminOrAdminId = req.userId;
  const { userPassword }: passwordInput = req.body;
  const { userId } = req.params;

  if (!ULID_REGEX.test(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const superAdminOrAdmin = await prisma.user.findFirst({
    where: { id: superAdminOrAdminId },
    select: { id: true, password: true },
  });

  if (!superAdminOrAdmin) {
    throw new ApiError(401, "Unauthorized");
  }

  const isValid = await isPasswordValid(
    userPassword,
    superAdminOrAdmin.password
  );
  if (!isValid) {
    throw new ApiError(400, "Invalid Password");
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const isManager = targetUser.role === Role.MANAGER;
  const newRole = isManager ? Role.USER : Role.MANAGER;
  const actionType = isManager
    ? Action.DEMOTE_TO_MANAGER
    : Action.PROMOTE_TO_MANAGER;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: superAdminOrAdmin.id,
        targetUserId: updatedUser.id,
        action: actionType,
      },
    });

    return updatedUser;
  });

  const message = isManager
    ? "User demoted from Manager successfully"
    : "User promoted to Manager successfully";

  return new ApiResponse(200, message, result).send(res);
});

// admin or super admin can update user status
const updateUserStatus = handleAsync(async (req, res) => {
  const performerId = req.userId;
  const { userPassword }: passwordInput = req.body;
  const { userId } = req.params;

  if (!ULID_REGEX.test(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const performer = await prisma.user.findFirst({
    where: { id: performerId },
    select: { id: true, role: true, password: true },
  });

  if (!performer) {
    throw new ApiError(401, "Unauthorized");
  }

  const isValid = await isPasswordValid(userPassword, performer.password);
  if (!isValid) {
    throw new ApiError(400, "Invalid Password");
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  if (targetUser.role !== Role.USER) {
    throw new ApiError(
      403,
      "Only USER accounts can be activated or deactivated"
    );
  }

  const isActive = targetUser.isActive;
  const newStatus = !isActive;

  const actionType = isActive ? Action.DEACTIVATE_USER : Action.ACTIVATE_USER;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { isActive: newStatus },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: performer.id,
        targetUserId: updatedUser.id,
        action: actionType,
      },
    });

    return updatedUser;
  });

  const message = isActive
    ? "User deactivated successfully"
    : "User activated successfully";

  return new ApiResponse(200, message, result).send(res);
});

// admin or super admin can get all users
const getAllUsers = handleAsync(async (req, res) => {
  const performerId = req.userId;

  const performer = await prisma.user.findFirst({
    where: { id: performerId },
    select: { id: true, role: true },
  });

  if (!performer) {
    throw new ApiError(401, "Unauthorized");
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const role = req.query.role as Role | undefined;
  const isActive =
    req.query.isActive !== undefined
      ? req.query.isActive === "true"
      : undefined;

  const search = req.query.search as string | undefined;

  const where: {
    role?: Role;
    isActive?: boolean;
    email?: {
      contains: string;
      mode: "insensitive";
    };
  } = {};

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.email = {
      contains: search,
      mode: "insensitive",
    };
  }

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const totalUsers = await prisma.user.count({ where });

  const responseData = {
    page,
    limit,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    users,
  };

  return new ApiResponse(200, "Users fetched successfully", responseData).send(
    res
  );
});

export {
  createManager,
  createAdmin,
  updateUserStatus,
  getAllUsers,
  promoteOrDemoteManager,
};

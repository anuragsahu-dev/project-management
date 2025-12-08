import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPasswordUser = await bcrypt.hash("UserPassword", 10);
  const hashedPasswordAdmin = await bcrypt.hash("AdminPassword", 10);
  const hashedPasswordSuperAdmin = await bcrypt.hash("SuperAdminPassword", 10);
  const hashedPasswordManager = await bcrypt.hash("ManagerPassword", 10);

  await prisma.$transaction(async (tx) => {
    const superAdmin = await tx.user.create({
      data: {
        email: "superadmin@example.com",
        password: hashedPasswordSuperAdmin,
        role: "SUPER_ADMIN",
        fullName: "Super Admin User",
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    const admin = await tx.user.create({
      data: {
        email: "admin@example.com",
        password: hashedPasswordAdmin,
        role: "ADMIN",
        fullName: "Admin User",
        isEmailVerified: true,
        emailVerificationToken: null,
        createdById: superAdmin.id,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: superAdmin.id,
        targetUserId: admin.id,
        action: "CREATE_ADMIN",
      },
    });

    const manager = await tx.user.create({
      data: {
        email: "manager@example.com",
        password: hashedPasswordManager,
        role: "MANAGER",
        fullName: "Manager User",
        isEmailVerified: true,
        emailVerificationToken: null,
        createdById: admin.id,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: admin.id,
        targetUserId: manager.id,
        action: "CREATE_MANAGER",
      },
    });

    const user = await tx.user.create({
      data: {
        email: "user@example.com",
        password: hashedPasswordUser,
        role: "USER",
        fullName: "User User",
        isEmailVerified: true,
        emailVerificationToken: null,
        createdById: manager.id,
      },
    });

    await tx.userActionLog.create({
      data: {
        performedById: manager.id,
        targetUserId: user.id,
        action: "CREATE_USER",
      },
    });
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  ADMIN
  MANAGER
  USER
}

enum ProjectRole {
  PROJECT_HEAD
  PROJECT_MANAGER
  TEAM_MEMBER
}

model User {
  id                      String          @id @default(ulid())
  avatar                  String          @default("https://placehold.co/200x200")
  avatarId                String?
  email                   String          @unique
  fullName                String
  password                String
  role                    Role            @default(USER)
  isEmailVerified         Boolean         @default(false)
  isActive                Boolean         @default(true)
  activateAt              DateTime?
  deactivateAt            DateTime?
  refreshToken            String?
  forgotPasswordToken     String?
  forgotPasswordExpiry    DateTime?
  emailVerificationToken  String?
  emailVerificationExpiry DateTime?
  createdById             String?
  createdBy               User?           @relation("UserCreatedBy", fields: [createdById], references: [id])
  createdUsers            User[]          @relation("UserCreatedBy")
  createdProjects         Project[]       @relation("CreatedProjects") // projects created by user
  projectMemberships      ProjectMember[] //  projects the user is a member of
  taskAssignedTo          Task[]          @relation("TasksAssignedTo")
  taskAssignedBy          Task[]          @relation("TasksAssignedBy")
  notesCreatedBy          ProjectNote[] // how many project notes created by this user
  createdSubTasks         SubTask[]
  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt
  changeUserActionBy      UserActionLog[] @relation("PerformedActions")
  performedOnUser         UserActionLog[] @relation("TargetedActions")

  @@index([isActive])
  @@index([role])
}

model Project {
  id           String          @id @default(ulid())
  name         String          @unique @db.VarChar(100)
  displayName  String
  description  String
  createdById  String
  createdBy    User            @relation("CreatedProjects", fields: [createdById], references: [id])
  members      ProjectMember[] //  Users who are members of this project
  projectTasks Task[] // how many tasks are created for this project
  projectNotes ProjectNote[] // how many notes are created for this project
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model ProjectMember {
  id          String      @id @default(ulid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectRole ProjectRole @default(TEAM_MEMBER)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([userId, projectId]) // Prevents duplicate memberships for the same user in the same project.
  @@index([projectId]) // Speeds up lookups by project
  @@index([userId]) // Speeds up lookups by user
}

enum Status {
  TODO
  IN_PROGRESS
  DONE
}

model Task {
  id           String    @id @default(ulid())
  title        String
  description  String?
  projectId    String
  project      Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignedToId String?
  assignedTo   User?     @relation("TasksAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)
  assignedById String?
  assignedBy   User?     @relation("TasksAssignedBy", fields: [assignedById], references: [id], onDelete: SetNull)
  status       Status    @default(TODO)
  attachments  Json      @default("[]") // stores array of {url, mimetype, size}
  subTasks     SubTask[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([status])
  @@index([projectId, status])
  @@index([assignedToId])
}

model SubTask {
  id          String   @id @default(ulid())
  title       String
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  isCompleted Boolean  @default(false)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Action {
  ACTIVATE_USER
  DEACTIVATE_USER
  PROMOTE_TO_ADMIN
  DEMOTE_TO_ADMIN
  PROMOTE_TO_MANAGER
  DEMOTE_TO_MANAGER
  CREATE_MANAGER
  CREATE_ADMIN
  CREATE_USER
}

model ProjectNote {
  id          String   @id @default(ulid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
}

model UserActionLog {
  id            String   @id @default(ulid())
  performedById String
  performedBy   User     @relation("PerformedActions", fields: [performedById], references: [id])
  targetUserId  String
  targetUser    User     @relation("TargetedActions", fields: [targetUserId], references: [id])
  action        Action
  createdAt     DateTime @default(now())

  @@index([performedById])
  @@index([targetUserId])
}

import "dotenv/config";
import { PrismaClient, Role, ProjectRole, Status } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const dbUrl = process.env.DATABASE_URL || "";
const env = process.env.NODE_ENV;

if (env === "production") {
  throw new Error("Seed blocked: running in production.");
}

if (!dbUrl.includes("localhost") && !dbUrl.includes("postgres")) {
  throw new Error(`Seed blocked: DATABASE_URL is not local -> ${dbUrl}`);
}

async function main() {
  console.log("🌱 Starting seed...");

  const password = await bcrypt.hash("password", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      email: "superadmin@example.com",
      password,
      role: Role.SUPER_ADMIN,
      fullName: "Super Admin User",
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password,
      role: Role.ADMIN,
      fullName: "Admin User",
      isEmailVerified: true,
      emailVerificationToken: null,
      createdById: superAdmin.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      password,
      role: Role.MANAGER,
      fullName: "Manager User",
      isEmailVerified: true,
      emailVerificationToken: null,
      createdById: admin.id,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      password,
      role: Role.USER,
      fullName: "Target User",
      isEmailVerified: true,
      emailVerificationToken: null,
      createdById: manager.id,
    },
  });

  console.log("Users seeded (Password: 'password')");

  const projectsData = [
    {
      name: "website-redesign",
      displayName: "Website Redesign",
      description: "Overhaul of the corporate website with new branding.",
      createdById: admin.id,
    },
    {
      name: "mobile-app-launch",
      displayName: "Mobile App Launch",
      description: "Launch for iOS and Android markets in Q4.",
      createdById: manager.id,
    },
    {
      name: "internal-audit",
      displayName: "Internal Audit 2024",
      description: "Quarterly financial and security audit.",
      createdById: superAdmin.id,
    },
  ];

  for (const p of projectsData) {
    const project = await prisma.project.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });

    console.log(`👉 Processing Project: ${project.displayName}`);

    // CLEANUP: Remove dynamic data for this project to ensure a clean state (Idempotency)
    // We delete tasks so we don't duplicate them on every seed run.
    await prisma.subTask.deleteMany({
      where: { task: { projectId: project.id } },
    });
    await prisma.task.deleteMany({ where: { projectId: project.id } });
    await prisma.projectNote.deleteMany({ where: { projectId: project.id } });

    // 3. Add Members (Upsert ensures no duplicates)
    // Admin as Project Head
    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: admin.id, projectId: project.id } },
      update: { projectRole: ProjectRole.PROJECT_HEAD },
      create: {
        userId: admin.id,
        projectId: project.id,
        projectRole: ProjectRole.PROJECT_HEAD,
      },
    });

    // Manager as Project Manager
    await prisma.projectMember.upsert({
      where: {
        userId_projectId: { userId: manager.id, projectId: project.id },
      },
      update: { projectRole: ProjectRole.PROJECT_MANAGER },
      create: {
        userId: manager.id,
        projectId: project.id,
        projectRole: ProjectRole.PROJECT_MANAGER,
      },
    });

    // User as Team Member
    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: user.id, projectId: project.id } },
      update: { projectRole: ProjectRole.TEAM_MEMBER },
      create: {
        userId: user.id,
        projectId: project.id,
        projectRole: ProjectRole.TEAM_MEMBER,
      },
    });

    // 4. Create Tasks
    await prisma.task.create({
      data: {
        title: "Project Setup",
        description: "Initialize repository and set up environment.",
        projectId: project.id,
        status: Status.DONE,
        assignedToId: manager.id,
        assignedById: admin.id,
        subTasks: {
          create: [
            {
              title: "Create GitHub Repo",
              createdById: manager.id,
              isCompleted: true,
            },
            {
              title: "Configure CI/CD",
              createdById: manager.id,
              isCompleted: true,
            },
          ],
        },
      },
    });

    await prisma.task.create({
      data: {
        title: "Requirements Gathering",
        description: "Collect requirements from stakeholders.",
        projectId: project.id,
        status: Status.IN_PROGRESS,
        assignedToId: user.id,
        assignedById: manager.id,
        subTasks: {
          create: [
            {
              title: "Draft Requirement Doc",
              createdById: manager.id,
              isCompleted: true,
            },
            {
              title: "Review with CTO",
              createdById: manager.id,
              isCompleted: false,
            },
          ],
        },
      },
    });

    await prisma.task.create({
      data: {
        title: "Frontend Implementation",
        description: "Implement the main UI components.",
        projectId: project.id,
        status: Status.TODO,
        assignedToId: user.id,
        assignedById: manager.id,
      },
    });

    // 5. Notes
    await prisma.projectNote.create({
      data: {
        content: `Kickoff meeting notes: The goal is to finish by end of quarter.`,
        projectId: project.id,
        createdById: manager.id,
      },
    });
  }

  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

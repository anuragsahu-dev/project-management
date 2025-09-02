/*
  Warnings:

  - The values [ADMIN,PROJECT_ADMIN] on the enum `ProjectRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."Action" AS ENUM ('DEACTIVATE', 'REACTIVATE', 'PROMOTE_TO_ADMIN', 'DEMOTE_TO_USER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProjectRole_new" AS ENUM ('OWNER', 'MANAGER', 'TEAM_MEMBER');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "projectRole" DROP DEFAULT;
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "projectRole" TYPE "public"."ProjectRole_new" USING ("projectRole"::text::"public"."ProjectRole_new");
ALTER TYPE "public"."ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "public"."ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "projectRole" SET DEFAULT 'TEAM_MEMBER';
COMMIT;

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "public"."ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectNote" DROP CONSTRAINT "ProjectNote_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubTask" DROP CONSTRAINT "SubTask_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "deactivateAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."UserActionLog" (
    "id" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "action" "public"."Action" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubTask" ADD CONSTRAINT "SubTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectNote" ADD CONSTRAINT "ProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActionLog" ADD CONSTRAINT "UserActionLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActionLog" ADD CONSTRAINT "UserActionLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - The values [DEACTIVATE,REACTIVATE,DEMOTE_TO_USER] on the enum `Action` will be removed. If these variants are still used in the database, this will fail.
  - The values [OWNER,MANAGER] on the enum `ProjectRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `name` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Action_new" AS ENUM ('ACTIVATE_USER', 'DEACTIVATE_USER', 'PROMOTE_TO_ADMIN', 'DEMOTE_TO_ADMIN', 'PROMOTE_TO_MANAGER', 'DEMOTE_TO_MANAGER', 'CREATE_MANAGER', 'CREATE_ADMIN', 'CREATE_USER');
ALTER TABLE "public"."UserActionLog" ALTER COLUMN "action" TYPE "public"."Action_new" USING ("action"::text::"public"."Action_new");
ALTER TYPE "public"."Action" RENAME TO "Action_old";
ALTER TYPE "public"."Action_new" RENAME TO "Action";
DROP TYPE "public"."Action_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProjectRole_new" AS ENUM ('PROJECT_HEAD', 'PROJECT_MANAGER', 'TEAM_MEMBER');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "projectRole" DROP DEFAULT;
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "projectRole" TYPE "public"."ProjectRole_new" USING ("projectRole"::text::"public"."ProjectRole_new");
ALTER TYPE "public"."ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "public"."ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "projectRole" SET DEFAULT 'TEAM_MEMBER';
COMMIT;

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'MANAGER';

-- DropForeignKey
ALTER TABLE "public"."SubTask" DROP CONSTRAINT "SubTask_createdById_fkey";

-- DropIndex
DROP INDEX "public"."User_username_key";

-- AlterTable
ALTER TABLE "public"."Project" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "phoneNumber",
DROP COLUMN "username",
ADD COLUMN     "activateAt" TIMESTAMP(3),
ADD COLUMN     "createdById" TEXT;

-- CreateIndex
CREATE INDEX "ProjectNote_projectId_idx" ON "public"."ProjectNote"("projectId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "public"."Task"("status");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "public"."Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "public"."Task"("assignedToId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "UserActionLog_performedById_idx" ON "public"."UserActionLog"("performedById");

-- CreateIndex
CREATE INDEX "UserActionLog_targetUserId_idx" ON "public"."UserActionLog"("targetUserId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubTask" ADD CONSTRAINT "SubTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

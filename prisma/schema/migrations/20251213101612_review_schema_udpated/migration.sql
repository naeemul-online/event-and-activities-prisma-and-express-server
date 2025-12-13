/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hostId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Review_userId_idx";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hostId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Review_hostId_idx" ON "Review"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_eventId_userId_key" ON "Review"("eventId", "userId");

/*
  Warnings:

  - You are about to drop the column `userId` on the `Review` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,hostId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hostId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropIndex
DROP INDEX "public"."Review_eventId_userId_key";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "userId",
ADD COLUMN     "hostId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_eventId_hostId_key" ON "Review"("eventId", "hostId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

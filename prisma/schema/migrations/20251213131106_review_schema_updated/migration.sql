/*
  Warnings:

  - You are about to drop the column `hostId` on the `Review` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,userId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_hostId_fkey";

-- DropIndex
DROP INDEX "public"."Review_eventId_hostId_key";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "hostId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_eventId_userId_key" ON "Review"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

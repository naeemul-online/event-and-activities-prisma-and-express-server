/*
  Warnings:

  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "fee" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
ADD COLUMN     "images" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

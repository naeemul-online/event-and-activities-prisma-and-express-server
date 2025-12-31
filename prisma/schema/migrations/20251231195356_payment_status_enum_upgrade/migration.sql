/*
  Warnings:

  - The values [CANCELLED] on the enum `ParticipantStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [UNPAID,FAILED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParticipantStatus_new" AS ENUM ('JOINED', 'PENDING', 'LEFT');
ALTER TABLE "public"."EventParticipant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EventParticipant" ALTER COLUMN "status" TYPE "ParticipantStatus_new" USING ("status"::text::"ParticipantStatus_new");
ALTER TYPE "ParticipantStatus" RENAME TO "ParticipantStatus_old";
ALTER TYPE "ParticipantStatus_new" RENAME TO "ParticipantStatus";
DROP TYPE "public"."ParticipantStatus_old";
ALTER TABLE "EventParticipant" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";

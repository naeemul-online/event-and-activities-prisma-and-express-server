-- AlterTable
ALTER TABLE "EventParticipant" ALTER COLUMN "joinedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "queuePosition" INTEGER;

-- AlterTable
ALTER TABLE "Queue" ADD COLUMN     "currentPosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

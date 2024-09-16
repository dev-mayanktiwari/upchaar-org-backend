/*
  Warnings:

  - You are about to drop the column `status` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "status",
ADD COLUMN     "appointmentStatus" "Status" NOT NULL DEFAULT 'Pending';

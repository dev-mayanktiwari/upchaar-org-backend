/*
  Warnings:

  - You are about to drop the column `queueId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `queuePosition` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "queueId",
DROP COLUMN "queuePosition";

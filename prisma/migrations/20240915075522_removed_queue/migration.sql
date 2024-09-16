/*
  Warnings:

  - You are about to drop the `Queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_queueId_fkey";

-- DropForeignKey
ALTER TABLE "Queue" DROP CONSTRAINT "Queue_departmentId_fkey";

-- DropTable
DROP TABLE "Queue";

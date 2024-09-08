-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_departmentId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

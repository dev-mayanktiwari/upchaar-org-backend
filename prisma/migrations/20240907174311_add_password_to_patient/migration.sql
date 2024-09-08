/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Hospital` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Hospital` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_email_key" ON "Hospital"("email");

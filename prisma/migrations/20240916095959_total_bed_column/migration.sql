/*
  Warnings:

  - Added the required column `totalAvailableBeds` to the `BedCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalBeds` to the `BedCount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BedCount" ADD COLUMN     "totalAvailableBeds" INTEGER NOT NULL,
ADD COLUMN     "totalBeds" INTEGER NOT NULL;

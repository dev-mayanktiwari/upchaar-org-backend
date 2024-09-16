/*
  Warnings:

  - You are about to drop the column `availableBed` on the `BedCount` table. All the data in the column will be lost.
  - You are about to drop the column `totalBed` on the `BedCount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BedCount" DROP COLUMN "availableBed",
DROP COLUMN "totalBed";

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "contact" TEXT NOT NULL DEFAULT '999999',
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 4;

-- CreateTable
CREATE TABLE "ICU" (
    "id" SERIAL NOT NULL,
    "totalBed" INTEGER NOT NULL DEFAULT 50,
    "availableBed" INTEGER NOT NULL DEFAULT 20,
    "bedCountId" INTEGER NOT NULL,

    CONSTRAINT "ICU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "General" (
    "id" SERIAL NOT NULL,
    "totalBed" INTEGER NOT NULL DEFAULT 200,
    "availableBed" INTEGER NOT NULL DEFAULT 120,
    "bedCountId" INTEGER NOT NULL,

    CONSTRAINT "General_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premium" (
    "id" SERIAL NOT NULL,
    "totalBed" INTEGER NOT NULL DEFAULT 80,
    "availableBed" INTEGER NOT NULL DEFAULT 20,
    "bedCountId" INTEGER NOT NULL,

    CONSTRAINT "Premium_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ICU_bedCountId_key" ON "ICU"("bedCountId");

-- CreateIndex
CREATE UNIQUE INDEX "General_bedCountId_key" ON "General"("bedCountId");

-- CreateIndex
CREATE UNIQUE INDEX "Premium_bedCountId_key" ON "Premium"("bedCountId");

-- AddForeignKey
ALTER TABLE "ICU" ADD CONSTRAINT "ICU_bedCountId_fkey" FOREIGN KEY ("bedCountId") REFERENCES "BedCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "General" ADD CONSTRAINT "General_bedCountId_fkey" FOREIGN KEY ("bedCountId") REFERENCES "BedCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Premium" ADD CONSTRAINT "Premium_bedCountId_fkey" FOREIGN KEY ("bedCountId") REFERENCES "BedCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

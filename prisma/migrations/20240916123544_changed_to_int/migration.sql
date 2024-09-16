/*
  Warnings:

  - Changed the type of `contact` on the `Hospital` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `zipcode` on the `Hospital` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Hospital" DROP COLUMN "contact",
ADD COLUMN     "contact" INTEGER NOT NULL,
ALTER COLUMN "rating" DROP DEFAULT,
DROP COLUMN "zipcode",
ADD COLUMN     "zipcode" INTEGER NOT NULL;

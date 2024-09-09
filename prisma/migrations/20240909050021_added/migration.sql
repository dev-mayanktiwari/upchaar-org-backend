-- CreateTable
CREATE TABLE "BedCount" (
    "id" SERIAL NOT NULL,
    "totalBed" INTEGER NOT NULL DEFAULT 100,
    "availableBed" INTEGER NOT NULL DEFAULT 100,
    "hospitalId" INTEGER NOT NULL,

    CONSTRAINT "BedCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BedCount_hospitalId_key" ON "BedCount"("hospitalId");

-- AddForeignKey
ALTER TABLE "BedCount" ADD CONSTRAINT "BedCount_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

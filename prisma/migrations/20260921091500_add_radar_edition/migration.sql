-- CreateTable
CREATE TABLE "RadarEdition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "radarJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadarEdition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RadarEdition_userId_generatedAt_idx" ON "RadarEdition"("userId", "generatedAt");

-- AddForeignKey
ALTER TABLE "RadarEdition" ADD CONSTRAINT "RadarEdition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

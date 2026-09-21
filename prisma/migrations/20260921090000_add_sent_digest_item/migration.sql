-- CreateTable
CREATE TABLE "SentDigestItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "musicEventId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentDigestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentDigestItem_userId_musicEventId_key" ON "SentDigestItem"("userId", "musicEventId");

-- CreateIndex
CREATE INDEX "SentDigestItem_userId_idx" ON "SentDigestItem"("userId");

-- AddForeignKey
ALTER TABLE "SentDigestItem" ADD CONSTRAINT "SentDigestItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentDigestItem" ADD CONSTRAINT "SentDigestItem_musicEventId_fkey" FOREIGN KEY ("musicEventId") REFERENCES "MusicEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

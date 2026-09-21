-- AlterTable
ALTER TABLE "ConnectedAccount" ADD COLUMN     "playlistId" TEXT;

-- AlterTable
ALTER TABLE "MusicEvent" ADD COLUMN     "externalId" TEXT;

-- CreateTable
CREATE TABLE "PlaylistTrackItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "musicEventId" TEXT NOT NULL,
    "trackUri" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrackItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrackItem_userId_musicEventId_key" ON "PlaylistTrackItem"("userId", "musicEventId");

-- CreateIndex
CREATE INDEX "PlaylistTrackItem_userId_idx" ON "PlaylistTrackItem"("userId");

-- AddForeignKey
ALTER TABLE "PlaylistTrackItem" ADD CONSTRAINT "PlaylistTrackItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrackItem" ADD CONSTRAINT "PlaylistTrackItem_musicEventId_fkey" FOREIGN KEY ("musicEventId") REFERENCES "MusicEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

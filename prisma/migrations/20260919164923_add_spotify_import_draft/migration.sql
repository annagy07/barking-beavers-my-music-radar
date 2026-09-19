-- CreateTable
CREATE TABLE "SpotifyImportDraft" (
    "id" TEXT NOT NULL,
    "artistsJson" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "scope" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotifyImportDraft_pkey" PRIMARY KEY ("id")
);

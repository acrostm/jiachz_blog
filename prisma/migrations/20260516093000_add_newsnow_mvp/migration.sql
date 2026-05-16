-- Add NewsNow-inspired news cache, user preferences, and saved items.

CREATE TABLE "NewsSourceCache" (
  "sourceId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'success',
  "error" TEXT,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsSourceCache_pkey" PRIMARY KEY ("sourceId")
);

CREATE TABLE "NewsUserPreference" (
  "userId" TEXT NOT NULL,
  "sourceOrder" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "hiddenSources" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "defaultColumn" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsUserPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "NewsSavedItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mobileUrl" TEXT,
  "excerpt" TEXT,
  "info" TEXT,
  "publishedAt" TIMESTAMP(3),
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsSavedItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsSavedItem_userId_sourceId_itemId_key"
  ON "NewsSavedItem"("userId", "sourceId", "itemId");

CREATE INDEX "NewsSavedItem_userId_createdAt_idx"
  ON "NewsSavedItem"("userId", "createdAt");

CREATE INDEX "NewsSavedItem_sourceId_idx"
  ON "NewsSavedItem"("sourceId");

ALTER TABLE "NewsUserPreference"
  ADD CONSTRAINT "NewsUserPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NewsSavedItem"
  ADD CONSTRAINT "NewsSavedItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

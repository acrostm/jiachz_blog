CREATE TABLE "BarkConfig" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "defaultGroup" TEXT NOT NULL DEFAULT 'Blog',
  "defaultCategory" TEXT NOT NULL DEFAULT '通知',
  "defaultIcon" TEXT NOT NULL,
  "defaultSound" TEXT NOT NULL DEFAULT 'default',
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BarkConfig_pkey" PRIMARY KEY ("id")
);

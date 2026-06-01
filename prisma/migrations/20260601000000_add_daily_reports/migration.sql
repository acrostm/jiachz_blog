-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_slug_key" ON "DailyReport"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportType_date_key" ON "DailyReport"("reportType", "date");

-- CreateIndex
CREATE INDEX "DailyReport_date_idx" ON "DailyReport"("date");

-- CreateIndex
CREATE INDEX "DailyReport_reportType_idx" ON "DailyReport"("reportType");

-- CreateIndex
CREATE INDEX "DailyReport_published_idx" ON "DailyReport"("published");

-- CreateIndex
CREATE INDEX "DailyReport_createdAt_idx" ON "DailyReport"("createdAt");

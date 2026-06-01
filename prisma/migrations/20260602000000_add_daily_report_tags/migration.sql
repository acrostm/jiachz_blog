-- AlterEnum
ALTER TYPE "TagTypeEnum" ADD VALUE 'DAILY_REPORT';

-- CreateTable
CREATE TABLE "_DailyReportToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DailyReportToTag_AB_unique" ON "_DailyReportToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DailyReportToTag_B_index" ON "_DailyReportToTag"("B");

-- AddForeignKey
ALTER TABLE "_DailyReportToTag" ADD CONSTRAINT "_DailyReportToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyReportToTag" ADD CONSTRAINT "_DailyReportToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

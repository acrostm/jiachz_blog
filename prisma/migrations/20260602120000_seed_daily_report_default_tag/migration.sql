-- Create the default tag used by all daily reports.
INSERT INTO "Tag" ("id", "name", "slug", "type", "createdAt", "updatedAt")
VALUES (
    'daily-report-default-tag',
    'daily-report',
    'daily-report',
    'DAILY_REPORT',
    NOW(),
    NOW()
)
ON CONFLICT ("slug") DO UPDATE
SET
    "type" = 'DAILY_REPORT',
    "updatedAt" = NOW();

-- Backfill the default tag onto existing daily reports.
INSERT INTO "_DailyReportToTag" ("A", "B")
SELECT "DailyReport"."id", "Tag"."id"
FROM "DailyReport"
JOIN "Tag" ON "Tag"."slug" = 'daily-report'
ON CONFLICT DO NOTHING;

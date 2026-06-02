import {
  DailyReportsPage,
  getPublishedDailyReportArchive,
  getPublishedDailyReportsByDate,
} from "@/features/daily-report";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; reportType?: string }>;
}) {
  const params = await searchParams;
  const archive = await getPublishedDailyReportArchive();
  const selectedDate = params.date ?? archive.dates[0] ?? "";
  const selectedReportType = params.reportType;
  const { reports } = await getPublishedDailyReportsByDate(selectedDate);

  return (
    <DailyReportsPage
      reports={reports}
      archiveReports={archive.reports}
      dates={archive.dates}
      reportTypes={archive.reportTypes}
      selectedDate={selectedDate}
      selectedReportType={selectedReportType}
    />
  );
}

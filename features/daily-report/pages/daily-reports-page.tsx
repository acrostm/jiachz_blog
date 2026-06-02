import React from "react";

import { Archive, Layers3 } from "lucide-react";

import { IllustrationNoContent } from "@/components/illustrations";
import { GsapReveal } from "@/components/motion/gsap-reveal";
import { Wrapper } from "@/components/wrapper";

import { PLACEHOLDER_TEXT } from "@/constants";

import { DailyReportCalendar } from "../components/daily-report-calendar";
import {
  DailyReportContent,
  type DailyReportContentItem,
} from "../components/daily-report-content";
import { type DailyReport } from "../types";

type DailyReportsPageProps = {
  reports: DailyReport[];
  archiveReports: Array<{
    date: string;
    reportType: string;
  }>;
  dates: string[];
  reportTypes: string[];
  selectedDate: string;
  selectedReportType?: string;
};

export const DailyReportsPage = ({
  reports,
  archiveReports,
  dates,
  reportTypes,
  selectedDate,
  selectedReportType,
}: DailyReportsPageProps) => {
  const reportItems = reports.map(toDailyReportContentItem);

  return (
    <Wrapper className="flex min-h-screen flex-col px-4 pb-24 pt-8 sm:px-6 md:px-10">
      <GsapReveal>
        <header
          data-gsap-reveal
          className="mb-8 flex flex-col gap-5 border-b border-[var(--future-line)] pb-7 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="future-label">Daily Reports</span>
              <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
            </div>
            <h1 className="future-heading text-4xl font-black leading-tight md:text-6xl">
              每日日报
            </h1>
            <p className="future-muted mt-4 text-base leading-8 md:text-lg">
              每天早上由我的 agent 自动总结。选择日历日期进入当天归档，再用主题
              tab 直接切换正文。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-[360px]">
            <Metric
              label="Dates"
              value={String(dates.length).padStart(2, "0")}
            />
            <Metric
              label="Topics"
              value={String(reportTypes.length).padStart(2, "0")}
            />
            <div className="future-muted col-span-2 flex items-center gap-2 text-sm">
              <Archive className="size-4 text-[var(--future-accent)]" />
              当前日期：{selectedDate || PLACEHOLDER_TEXT}
            </div>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside data-gsap-reveal className="lg:sticky lg:top-24 lg:self-start">
            <DailyReportCalendar
              archiveReports={archiveReports}
              dates={dates}
              selectedDate={selectedDate}
            />
          </aside>

          <main data-gsap-reveal className="min-w-0">
            {!reports.length ? (
              <div className="future-panel-strong grid min-h-[56vh] place-content-center gap-6 rounded-2xl p-8 text-center">
                <IllustrationNoContent className="mx-auto size-[24vh]" />
                <div>
                  <div className="future-label mb-3 flex items-center justify-center gap-2">
                    <Layers3 className="size-3.5" />
                    {selectedDate || PLACEHOLDER_TEXT}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-normal">
                    这一天还没有日报
                  </h2>
                  <p className="future-muted mt-3 max-w-xl text-sm leading-7">
                    可以在左侧日历选择带有标记的日期，或者等待自动化 agent
                    完成当天写入。
                  </p>
                </div>
              </div>
            ) : (
              <DailyReportContent
                reports={reportItems}
                selectedDate={selectedDate}
                selectedReportType={selectedReportType}
              />
            )}
          </main>
        </div>
      </GsapReveal>
    </Wrapper>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="future-panel rounded-2xl p-4">
      <p className="future-label">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tracking-normal">
        {value}
      </p>
    </div>
  );
};

const toDailyReportContentItem = (
  report: DailyReport,
): DailyReportContentItem => ({
  id: report.id,
  reportType: report.reportType,
  date: report.date,
  title: report.title,
  summary: report.summary,
  body: report.body,
  generatedAt: report.generatedAt?.toISOString() ?? null,
  tags: report.tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    icon: tag.icon,
    iconDark: tag.iconDark,
  })),
});

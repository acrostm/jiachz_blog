import React from "react";

import Link from "next/link";

import { CalendarDays, Clock3, Layers3, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { BytemdViewer } from "@/components/bytemd";
import { IllustrationNoContent } from "@/components/illustrations";
import { GsapReveal } from "@/components/motion/gsap-reveal";
import { Wrapper } from "@/components/wrapper";

import { PATHS, PLACEHOLDER_TEXT } from "@/constants";
import { TagPrefixIcon } from "@/features/tag";
import { cn, prettyDateWithWeekday, toSlashDateString } from "@/lib/utils";

import { DailyReportSelector } from "../components/daily-report-selector";
import { type DailyReport } from "../types";

type DailyReportsPageProps = {
  reports: DailyReport[];
  dates: string[];
  reportTypes: string[];
  selectedDate: string;
  selectedReportType?: string;
};

export const DailyReportsPage = ({
  reports,
  dates,
  reportTypes,
  selectedDate,
  selectedReportType,
}: DailyReportsPageProps) => {
  const activeReport = reports[0];

  return (
    <Wrapper className="flex min-h-screen flex-col px-6 pb-24 pt-12">
      <GsapReveal>
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[var(--future-line)] px-6 py-10 md:px-10 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgb(223_114_69/0.18),transparent_34%),radial-gradient(circle_at_86%_14%,rgb(34_211_238/0.16),transparent_30%)]" />
          <div className="relative z-[1] grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div data-gsap-reveal>
              <div className="mb-6 flex items-center gap-3">
                <span className="future-label">Daily Reports</span>
                <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
              </div>
              <h1 className="future-heading max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
                每日日报
              </h1>
              <p className="future-muted mt-6 max-w-2xl text-base leading-8 md:text-lg">
                每天早上由我的agent自动总结，生成的日报会按日期和主题归档。
              </p>
            </div>

            <div
              data-gsap-reveal
              className="future-panel grid grid-cols-2 gap-4 rounded-3xl p-5"
            >
              <Metric
                label="Dates"
                value={String(dates.length).padStart(2, "0")}
              />
              <Metric
                label="Topics"
                value={String(reportTypes.length).padStart(2, "0")}
              />
              <div className="col-span-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <p className="future-muted col-span-2 text-sm leading-6">
                当前日期：{selectedDate || PLACEHOLDER_TEXT}
              </p>
            </div>
          </div>
        </section>

        <DailyReportSelector
          dates={dates}
          reportTypes={reportTypes}
          selectedDate={selectedDate}
          selectedReportType={selectedReportType}
        />

        {!reports.length ? (
          <div className="grid place-content-center gap-6 py-20 text-center">
            <IllustrationNoContent className="mx-auto size-[28vh]" />
            <h2 className="text-2xl font-semibold tracking-normal">
              这一天还没有日报
            </h2>
            <p className="future-muted max-w-xl text-sm leading-7">
              可以换一个日期，或者等待自动化 agent 完成当天的写入。
            </p>
          </div>
        ) : (
          <div
            data-gsap-reveal
            className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]"
          >
            <aside className="space-y-3">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`${PATHS.SITE_DAILY_REPORTS}?date=${report.date}&reportType=${report.reportType}`}
                  className={cn(
                    "future-panel block rounded-2xl p-4 transition",
                    report.id === activeReport?.id &&
                      "border-[color:var(--future-accent)] bg-white/[0.06]",
                  )}
                >
                  <div className="future-label mb-3 flex items-center gap-2">
                    <Layers3 className="size-3.5" />
                    {report.reportType}
                  </div>
                  <h2 className="line-clamp-2 text-base font-semibold tracking-normal">
                    {report.title}
                  </h2>
                  <p className="future-muted mt-2 line-clamp-3 text-sm leading-6">
                    {report.summary}
                  </p>
                </Link>
              ))}
            </aside>

            {activeReport && (
              <article className="future-panel-strong overflow-hidden rounded-[2rem] px-5 py-7 md:p-10">
                <div className="mb-8 border-b border-[var(--future-line)] pb-8">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="font-mono uppercase">
                      {activeReport.reportType}
                    </Badge>
                    <Meta icon={<CalendarDays className="size-4" />}>
                      {prettyDateWithWeekday(
                        new Date(`${activeReport.date}T00:00:00`),
                      )}
                    </Meta>
                    {activeReport.generatedAt && (
                      <Meta icon={<Clock3 className="size-4" />}>
                        {toSlashDateString(activeReport.generatedAt)}
                      </Meta>
                    )}
                  </div>
                  <h2 className="future-heading text-4xl font-black leading-tight md:text-6xl">
                    {activeReport.title}
                  </h2>
                  <p className="future-muted mt-5 max-w-3xl text-base leading-8">
                    {activeReport.summary}
                  </p>
                  {activeReport.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {activeReport.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="border-[var(--future-line)] bg-white/[0.04]"
                        >
                          <TagPrefixIcon tag={tag} className="mr-1 size-3" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <BytemdViewer body={activeReport.body} />

                {activeReport.tags.length === 0 && (
                  <div className="future-muted mt-10 flex items-center gap-2 border-t border-[var(--future-line)] pt-6 text-sm">
                    <Tags className="size-4" />
                    暂无标签
                  </div>
                )}
              </article>
            )}
          </div>
        )}
      </GsapReveal>
    </Wrapper>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <p className="future-label">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tracking-normal">
        {value}
      </p>
    </div>
  );
};

const Meta = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <span className="future-muted inline-flex items-center gap-1.5 font-mono text-xs">
      {icon}
      {children}
    </span>
  );
};

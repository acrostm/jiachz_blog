"use client";

import React from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CalendarDays, Clock3, Layers3, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { BytemdViewer } from "@/components/bytemd";

import { TagPrefixIcon } from "@/features/tag";
import { cn, prettyDateWithWeekday, toSlashDateString } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export type DailyReportContentItem = {
  id: string;
  reportType: string;
  date: string;
  title: string;
  summary: string;
  body: string;
  generatedAt: string | null;
  tags: Array<{
    id: string;
    name: string;
    icon: string | null;
    iconDark: string | null;
  }>;
};

type DailyReportContentProps = {
  reports: DailyReportContentItem[];
  selectedDate: string;
  selectedReportType?: string;
};

export const DailyReportContent = ({
  reports,
  selectedDate,
  selectedReportType,
}: DailyReportContentProps) => {
  const scope = React.useRef<HTMLDivElement>(null);
  const initialReport = getInitialReport(reports, selectedReportType);
  const [activeReportID, setActiveReportID] = React.useState(
    initialReport?.id ?? "",
  );
  const activeReport = React.useMemo(
    () =>
      reports.find((report) => report.id === activeReportID) ??
      reports[0] ??
      null,
    [activeReportID, reports],
  );

  React.useEffect(() => {
    const nextReport = getInitialReport(reports, selectedReportType);
    setActiveReportID(nextReport?.id ?? "");
  }, [reports, selectedReportType]);

  useGSAP(
    () => {
      if (!activeReport) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const content = gsap.utils.toArray<HTMLElement>(
        "[data-daily-report-active]",
      );

      if (reduceMotion) {
        gsap.set(content, {
          clearProps: "opacity,visibility,transform,filter",
        });
        return;
      }

      gsap.fromTo(
        content,
        { autoAlpha: 0, y: 18, filter: "blur(10px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.42,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(content, {
              clearProps: "opacity,visibility,transform,filter",
            });
          },
        },
      );
    },
    { dependencies: [activeReport?.id], scope },
  );

  if (!activeReport) {
    return null;
  }

  return (
    <div ref={scope} className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--future-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="future-label flex items-center gap-2">
            <Layers3 className="size-3.5" />
            {selectedDate}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">
            {reports.length} 个主题
          </h2>
        </div>

        {reports.length > 1 && (
          <div
            role="tablist"
            aria-label="选择日报主题"
            className="flex max-w-full gap-2 overflow-x-auto pb-1"
          >
            {reports.map((report) => {
              const isActive = report.id === activeReport.id;

              return (
                <button
                  key={report.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveReportID(report.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-2 font-mono text-xs uppercase transition",
                    "border-[var(--future-line)] bg-white/[0.03] text-muted-foreground hover:border-[color:var(--future-accent)] hover:text-foreground",
                    isActive &&
                      "border-[color:var(--future-accent)] bg-[rgb(223_114_69/0.18)] text-foreground",
                  )}
                >
                  {report.reportType}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <article
        key={activeReport.id}
        data-daily-report-active
        className="future-panel-strong min-w-0 overflow-hidden rounded-2xl px-5 py-7 md:p-10"
      >
        <div className="mb-8 border-b border-[var(--future-line)] pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="font-mono uppercase">
              {activeReport.reportType}
            </Badge>
            <Meta icon={<CalendarDays className="size-4" />}>
              {prettyDateWithWeekday(new Date(`${activeReport.date}T00:00:00`))}
            </Meta>
            {activeReport.generatedAt && (
              <Meta icon={<Clock3 className="size-4" />}>
                {toSlashDateString(new Date(activeReport.generatedAt))}
              </Meta>
            )}
          </div>
          <h1 className="future-heading text-4xl font-black leading-tight md:text-6xl">
            {activeReport.title}
          </h1>
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
    </div>
  );
};

const getInitialReport = (
  reports: DailyReportContentItem[],
  selectedReportType?: string,
) => {
  if (!reports.length) return null;

  return (
    reports.find((report) => report.reportType === selectedReportType) ??
    reports[0]
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

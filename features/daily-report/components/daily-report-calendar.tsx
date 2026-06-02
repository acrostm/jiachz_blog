"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PATHS } from "@/constants";
import { cn } from "@/lib/utils";

type DailyReportCalendarProps = {
  archiveReports: Array<{
    date: string;
    reportType: string;
  }>;
  dates: string[];
  onDateSelect?: () => void;
  selectedDate: string;
};

type CalendarCell = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const MONTH_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  year: "numeric",
});

export const DailyReportCalendar = ({
  archiveReports,
  dates,
  onDateSelect,
  selectedDate,
}: DailyReportCalendarProps) => {
  const router = useRouter();
  const initialMonth = selectedDate
    ? selectedDate
    : (dates[0] ?? toDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = React.useState(() =>
    getMonthParts(initialMonth),
  );
  const reportCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    archiveReports.forEach((report) => {
      map.set(report.date, (map.get(report.date) ?? 0) + 1);
    });

    return map;
  }, [archiveReports]);
  const monthCells = React.useMemo(
    () => buildMonthCells(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );
  const monthLabel = MONTH_FORMATTER.format(
    new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)),
  );

  React.useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(getMonthParts(selectedDate));
  }, [selectedDate]);

  return (
    <section
      className="future-panel-strong overflow-hidden rounded-2xl p-4 shadow-2xl shadow-black/35"
      style={{
        WebkitBackdropFilter: "blur(36px) saturate(1.45)",
        backdropFilter: "blur(36px) saturate(1.45)",
        background:
          "color-mix(in srgb, hsl(var(--background)) 96%, transparent)",
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="future-label flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            Calendar
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            {monthLabel}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="上个月"
            onClick={() => handleMonthChange(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="下个月"
            onClick={() => handleMonthChange(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="future-label grid aspect-square place-items-center text-[10px]"
          >
            {weekday}
          </div>
        ))}

        {monthCells.map((cell) => {
          const reportCount = reportCounts.get(cell.date) ?? 0;
          const hasReport = reportCount > 0;
          const isSelected = cell.date === selectedDate;

          return (
            <button
              key={cell.date}
              type="button"
              aria-label={`${cell.date}${hasReport ? `，${reportCount} 篇日报` : "，暂无日报"}`}
              onClick={() => handleDateSelect(cell.date)}
              className={cn(
                "relative grid aspect-square place-items-center rounded-xl border text-sm transition",
                "border-[var(--future-line)] bg-white/[0.025] hover:border-[color:var(--future-accent)] hover:bg-white/[0.07]",
                !cell.isCurrentMonth && "opacity-35",
                !hasReport && "text-muted-foreground",
                hasReport &&
                  "border-white/20 text-foreground shadow-[inset_0_0_0_1px_rgb(223_114_69/0.16)]",
                isSelected &&
                  "border-[color:var(--future-accent)] bg-[rgb(223_114_69/0.2)] text-foreground",
              )}
            >
              <span className="font-mono">{cell.day}</span>
              {hasReport && (
                <span
                  className={cn(
                    "absolute bottom-1.5 h-1.5 rounded-full bg-[color:var(--future-accent)]",
                    reportCount > 1 ? "w-3.5" : "w-1.5",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="future-muted mt-5 flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[color:var(--future-accent)]" />
          有日报
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full border border-[var(--future-line)]" />
          暂无日报
        </span>
      </div>
    </section>
  );

  function handleMonthChange(offset: number) {
    setVisibleMonth((current) => {
      const next = new Date(Date.UTC(current.year, current.month + offset, 1));

      return {
        year: next.getUTCFullYear(),
        month: next.getUTCMonth(),
      };
    });
  }

  function handleDateSelect(date: string) {
    router.push(`${PATHS.SITE_DAILY_REPORTS}?date=${date}`);
    onDateSelect?.();
  }
};

const getMonthParts = (dateKey: string) => {
  const [year = 0, month = 1] = dateKey.split("-").map(Number);

  return {
    year,
    month: month - 1,
  };
};

const buildMonthCells = (year: number, month: number): CalendarCell[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
  const previousMonthDays = getDaysInMonth(year, month - 1);
  const cells: CalendarCell[] = [];

  for (let index = mondayOffset - 1; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(year, month - 1, previousMonthDays - index));

    cells.push({
      date: toDateKey(date),
      day: date.getUTCDate(),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month, day));

    cells.push({
      date: toDateKey(date),
      day,
      isCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const date = new Date(Date.UTC(year, month + 1, nextDay));

    cells.push({
      date: toDateKey(date),
      day: date.getUTCDate(),
      isCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
};

const toDateKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

"use client";

import React from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DailyReportCalendar } from "./daily-report-calendar";

gsap.registerPlugin(useGSAP);

type DailyReportCalendarToggleProps = {
  archiveReports: Array<{
    date: string;
    reportType: string;
  }>;
  dates: string[];
  selectedDate: string;
};

export const DailyReportCalendarToggle = ({
  archiveReports,
  dates,
  selectedDate,
}: DailyReportCalendarToggleProps) => {
  const scope = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);

  useGSAP(
    () => {
      if (!open) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const panel = gsap.utils.toArray<HTMLElement>("[data-calendar-panel]");

      if (reduceMotion) {
        gsap.set(panel, { clearProps: "opacity,visibility,transform,filter" });
        return;
      }

      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: -10, filter: "blur(8px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.28,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [open], scope },
  );

  return (
    <div ref={scope} className="relative z-[80] w-full sm:w-auto">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-controls="daily-report-calendar-panel"
        className="size-full justify-center gap-2 rounded-2xl px-5 py-4 sm:min-w-[160px]"
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays className="size-4 text-[var(--future-accent)]" />
        {open ? "收起日历" : "打开日历"}
      </Button>

      {open && (
        <div
          id="daily-report-calendar-panel"
          data-calendar-panel
          className="absolute left-0 top-[calc(100%+0.75rem)] z-[90] w-[min(88vw,360px)] sm:left-auto sm:right-0"
        >
          <DailyReportCalendar
            archiveReports={archiveReports}
            dates={dates}
            selectedDate={selectedDate}
            onDateSelect={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

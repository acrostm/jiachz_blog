"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { CalendarDays, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PATHS } from "@/constants";

type DailyReportSelectorProps = {
  dates: string[];
  reportTypes: string[];
  selectedDate: string;
  selectedReportType?: string;
};

const ALL_REPORT_TYPES = "all";

export const DailyReportSelector = ({
  dates,
  reportTypes,
  selectedDate,
  selectedReportType,
}: DailyReportSelectorProps) => {
  const router = useRouter();
  const [date, setDate] = React.useState(selectedDate);
  const [reportType, setReportType] = React.useState(
    selectedReportType ?? ALL_REPORT_TYPES,
  );

  React.useEffect(() => {
    setDate(selectedDate);
    setReportType(selectedReportType ?? ALL_REPORT_TYPES);
  }, [selectedDate, selectedReportType]);

  return (
    <div className="future-glass grid gap-3 rounded-2xl p-4 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto] md:items-end">
      <label className="grid gap-2">
        <span className="future-label flex items-center gap-2">
          <CalendarDays className="size-3.5" />
          日期
        </span>
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          list="daily-report-dates"
        />
        <datalist id="daily-report-dates">
          {dates.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </label>

      <label className="grid gap-2">
        <span className="future-label flex items-center gap-2">
          <Filter className="size-3.5" />
          主题
        </span>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger>
            <SelectValue placeholder="选择主题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_REPORT_TYPES}>全部主题</SelectItem>
            {reportTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <Button type="button" onClick={handleNavigate}>
        查看日报
      </Button>
    </div>
  );

  function handleNavigate() {
    const params = new URLSearchParams();

    if (date) {
      params.set("date", date);
    }

    if (reportType && reportType !== ALL_REPORT_TYPES) {
      params.set("reportType", reportType);
    }

    const query = params.toString();
    router.push(
      query ? `${PATHS.SITE_DAILY_REPORTS}?${query}` : PATHS.SITE_DAILY_REPORTS,
    );
  }
};

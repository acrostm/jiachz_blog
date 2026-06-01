"use client";

import { Switch } from "@/components/ui/switch";

import { useToggleDailyReportPublish } from "@/features/daily-report";

type ToggleDailyReportPublishSwitchProps = {
  id: string;
  published: boolean;
  refreshAsync: () => Promise<unknown>;
};

export const ToggleDailyReportPublishSwitch = ({
  id,
  published,
  refreshAsync,
}: ToggleDailyReportPublishSwitchProps) => {
  const toggleDailyReportPublishQuery = useToggleDailyReportPublish();

  return (
    <Switch
      checked={published}
      disabled={toggleDailyReportPublishQuery.loading}
      onCheckedChange={async () => {
        await toggleDailyReportPublishQuery.runAsync(id);
        await refreshAsync();
      }}
    />
  );
};

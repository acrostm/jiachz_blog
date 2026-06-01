import { useRequest } from "ahooks";
import { toast } from "sonner";

import { toggleDailyReportPublished, updateDailyReport } from "../actions";

export const useUpdateDailyReport = () => {
  return useRequest(updateDailyReport, {
    manual: true,
    loadingDelay: 300,
    onSuccess(result) {
      if (result.success) {
        toast.success("日报已更新");
      } else {
        toast.error(`日报更新失败: ${result.error}`);
      }
    },
    onError(error) {
      toast.error(`日报更新失败: ${error.message}`);
    },
  });
};

export const useToggleDailyReportPublish = () => {
  return useRequest(toggleDailyReportPublished, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("日报发布状态已更新");
    },
    onError(error) {
      toast.error(`日报发布状态更新失败: ${error.message}`);
    },
  });
};

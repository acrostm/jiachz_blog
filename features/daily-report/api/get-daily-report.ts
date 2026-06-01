import { useRequest } from "ahooks";

import { getDailyReportByID } from "../actions";

export const useGetDailyReport = (id: string, ready: boolean) => {
  return useRequest(() => getDailyReportByID(id), {
    ready,
    loadingDelay: 300,
  });
};

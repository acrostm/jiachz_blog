import { useRequest } from "ahooks";

import { getDailyReports } from "../actions";
import { type GetDailyReportsDTO } from "../types";

export const useGetDailyReports = (params: GetDailyReportsDTO) => {
  return useRequest(() => getDailyReports(params), {
    refreshDeps: [params],
    loadingDelay: 300,
  });
};

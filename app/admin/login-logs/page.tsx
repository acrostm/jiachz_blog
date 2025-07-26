import { type Metadata } from "next";

import { PATHS, PATHS_MAP } from "@/constants";
import { LoginLogsPage } from "@/features/admin/pages/login-logs";
import { getAdminPageTitle } from "@/utils";

export const metadata: Metadata = {
  title: getAdminPageTitle(PATHS_MAP[PATHS.ADMIN_LOGIN_LOGS]),
};

export default function Page() {
  return <LoginLogsPage />;
}

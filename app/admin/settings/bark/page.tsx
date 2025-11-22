import { type Metadata } from "next";

import { PATHS, PATHS_MAP } from "@/constants";
import { BarkConfigPage } from "@/features/admin";
import { getAdminPageTitle } from "@/utils";

export const metadata: Metadata = {
  title: getAdminPageTitle(PATHS_MAP[PATHS.ADMIN_BARK_CONFIG]),
};

export default function Page() {
  return <BarkConfigPage />;
}

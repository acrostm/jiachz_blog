import { PATHS, PATHS_MAP } from "@/constants";

export const navItems: Array<{
  label?: string;
  link: string;
  external?: boolean;
}> = [
  {
    label: PATHS_MAP[PATHS.SITE_HOME],
    link: PATHS.SITE_HOME,
    external: false,
  },
  {
    label: PATHS_MAP[PATHS.SITE_BLOG],
    link: PATHS.SITE_BLOG,
    external: false,
  },
  {
    label: PATHS_MAP[PATHS.SITE_DAILY_REPORTS],
    link: PATHS.SITE_DAILY_REPORTS,
    external: false,
  },
  {
    label: PATHS_MAP[PATHS.SITE_NEWS],
    link: PATHS.SITE_NEWS,
    external: false,
  },
  {
    label: PATHS_MAP[PATHS.SITE_STEAM_PRICES],
    link: PATHS.SITE_STEAM_PRICES,
    external: false,
  },
  {
    label: PATHS_MAP[PATHS.SITE_MESSAGES],
    link: PATHS.SITE_MESSAGES,
    external: false,
  },
  {
    label: PATHS_MAP[PATHS.SITE_ABOUT],
    link: PATHS.SITE_ABOUT,
    external: false,
  },
];

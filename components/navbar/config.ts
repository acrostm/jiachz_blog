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
    label: PATHS_MAP[PATHS.SITE_NEWS],
    link: PATHS.SITE_NEWS,
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

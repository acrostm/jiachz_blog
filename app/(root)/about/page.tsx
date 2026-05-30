import { AboutExperience, getAboutSiteStats } from "@/features/about";

export const revalidate = 60;

export default async function Page() {
  const siteStats = await getAboutSiteStats();

  return <AboutExperience siteStats={siteStats} />;
}

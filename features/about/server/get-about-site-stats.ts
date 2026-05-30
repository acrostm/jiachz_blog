import { GITHUB_PAGE } from "@/constants";
import { prisma } from "@/lib/prisma";

import { type AboutSiteStats } from "../types";

const EXPERIENCE_YEARS = 5;
const CACHE_SECONDS = 600;

type GithubUserStatsResponse = {
  public_repos?: number;
};

export async function getAboutSiteStats(): Promise<AboutSiteStats> {
  const [contentResult, githubResult] = await Promise.allSettled([
    getContentStats(),
    getGithubProjectCount(),
  ]);

  const content =
    contentResult.status === "fulfilled" ? contentResult.value : undefined;
  const projectCount =
    githubResult.status === "fulfilled" ? githubResult.value : undefined;

  return {
    articleCount: content?.articleCount,
    totalReads: content?.totalReads,
    projectCount,
    experienceYears: EXPERIENCE_YEARS,
    status: getStatsStatus(Boolean(content), typeof projectCount === "number"),
  };
}

async function getContentStats() {
  const [articleCount, views] = await Promise.all([
    prisma.blog.count({
      where: {
        published: true,
      },
    }),
    prisma.blog.aggregate({
      _sum: {
        views: true,
      },
      where: {
        published: true,
      },
    }),
  ]);

  return {
    articleCount,
    totalReads: views._sum.views ?? 0,
  };
}

async function getGithubProjectCount() {
  const username = getGithubUsername(GITHUB_PAGE);
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "jiachz-blog-about-stats",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as GithubUserStatsResponse;

  return typeof payload.public_repos === "number"
    ? payload.public_repos
    : undefined;
}

function getGithubUsername(profileUrl: string) {
  const parts = profileUrl.split("/").filter(Boolean);
  return parts.at(-1) ?? "acrostm";
}

function getStatsStatus(hasContent: boolean, hasGithub: boolean) {
  if (hasContent && hasGithub) {
    return "live";
  }

  if (hasContent || hasGithub) {
    return "partial";
  }

  return "fallback";
}

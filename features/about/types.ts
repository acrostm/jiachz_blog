export type GithubActivityStatus = "live" | "partial" | "stale" | "error";

export type GithubProfileSummary = {
  login: string;
  name?: string;
  avatarUrl?: string;
  url: string;
  bio?: string;
  publicRepos: number;
  followers: number;
  updatedAt?: string;
};

export type GithubActivityEvent = {
  id: string;
  type: string;
  label: string;
  detail: string;
  repo: string;
  repoUrl: string;
  createdAt: string;
  tone: "accent" | "cyan" | "gold" | "rose";
};

export type GithubActivityRepo = {
  name: string;
  fullName: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  pushedAt?: string;
  updatedAt?: string;
  topics: string[];
};

export type GithubActivityStats = {
  publicRepos: number;
  followers: number;
  activeRepos: number;
  totalStars: number;
  pushEvents: number;
  latestEventAt?: string;
};

export type GithubContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  events: string[];
  future: boolean;
};

export type GithubContributionRhythm = {
  days: GithubContributionDay[];
  activeDays: number;
  longestStreak: number;
  totalEvents: number;
  since: string;
  until: string;
  source: "public-events";
  note: string;
};

export type GithubActivityResponse = {
  status: GithubActivityStatus;
  username: string;
  fetchedAt: string;
  cacheSeconds: number;
  latencyNote: string;
  profile: GithubProfileSummary;
  events: GithubActivityEvent[];
  repos: GithubActivityRepo[];
  stats: GithubActivityStats;
  rhythm: GithubContributionRhythm;
  error?: string;
  rateLimit?: {
    remaining?: number;
    resetAt?: string;
  };
};

export type AboutSiteStats = {
  articleCount?: number;
  totalReads?: number;
  projectCount?: number;
  experienceYears: number;
  status: "live" | "partial" | "fallback";
};

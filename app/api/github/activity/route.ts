import { NextResponse } from "next/server";

import { GITHUB_PAGE } from "@/constants";
import {
  type GithubActivityEvent,
  type GithubActivityRepo,
  type GithubActivityResponse,
  type GithubActivityStats,
  type GithubContributionDay,
  type GithubContributionRhythm,
  type GithubProfileSummary,
} from "@/features/about";

export const revalidate = 600;

const CACHE_SECONDS = 600;
const CONTRIBUTION_WEEKS = 26;
const USERNAME = getGithubUsername(GITHUB_PAGE);
const LATENCY_NOTE = "GitHub public events are live-ish: 30s to 6h delay.";
const RHYTHM_NOTE =
  "Contribution rhythm is estimated from public events, not the private GitHub contribution graph.";

let lastSuccessfulPayload: GithubActivityResponse | undefined;

type GithubUserResponse = {
  login: string;
  name: string | null;
  avatar_url: string | null;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  updated_at: string | null;
};

type GithubRepoResponse = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
  updated_at: string | null;
  topics?: string[];
};

type GithubEventResponse = {
  id: string;
  type: string;
  repo: {
    name: string;
  };
  payload: Record<string, unknown>;
  created_at: string;
};

type GithubFetchResult<T> = {
  data: T;
  rateLimit?: GithubActivityResponse["rateLimit"];
};

const EVENT_LABELS: Record<string, string> = {
  CommitCommentEvent: "评论了提交",
  CreateEvent: "创建了资源",
  DeleteEvent: "删除了资源",
  ForkEvent: "Fork 了仓库",
  GollumEvent: "更新了 Wiki",
  IssuesEvent: "处理了 Issue",
  IssueCommentEvent: "评论了 Issue",
  PullRequestEvent: "处理了 PR",
  PullRequestReviewEvent: "Review 了 PR",
  PullRequestReviewCommentEvent: "评论了 Review",
  PushEvent: "推送了代码",
  ReleaseEvent: "发布了版本",
  WatchEvent: "Star 了仓库",
};

const EVENT_TONES: GithubActivityEvent["tone"][] = [
  "accent",
  "cyan",
  "gold",
  "rose",
];

export async function GET() {
  const profileUrl = `https://api.github.com/users/${USERNAME}`;
  const reposUrl = `https://api.github.com/users/${USERNAME}/repos?type=owner&sort=pushed&per_page=8`;
  const eventsUrl = `https://api.github.com/users/${USERNAME}/events/public?per_page=100`;

  const [profileResult, reposResult, eventsResult] = await Promise.allSettled([
    fetchGithub<GithubUserResponse>(profileUrl),
    fetchGithub<GithubRepoResponse[]>(reposUrl),
    fetchGithub<GithubEventResponse[]>(eventsUrl),
  ]);

  const profile = readSettled(profileResult);
  const repos = readSettled(reposResult);
  const events = readSettled(eventsResult);

  if (!profile && !repos && !events) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        status: "stale",
        fetchedAt: new Date().toISOString(),
        error: "GitHub activity temporarily unavailable.",
      });
    }

    return NextResponse.json(buildEmptyPayload("GitHub activity unavailable."));
  }

  const normalizedProfile = normalizeProfile(profile?.data);
  const normalizedRepos = normalizeRepos(repos?.data ?? []);
  const normalizedEvents = normalizeEvents(events?.data ?? []);
  const rhythm = buildContributionRhythm(normalizedEvents);
  const stats = buildStats(
    normalizedProfile,
    normalizedRepos,
    normalizedEvents,
  );
  const status = profile && repos && events ? "live" : "partial";

  const payload: GithubActivityResponse = {
    status,
    username: USERNAME,
    fetchedAt: new Date().toISOString(),
    cacheSeconds: CACHE_SECONDS,
    latencyNote: LATENCY_NOTE,
    profile: normalizedProfile,
    events: normalizedEvents,
    repos: normalizedRepos,
    stats,
    rhythm,
    rateLimit: profile?.rateLimit ?? repos?.rateLimit ?? events?.rateLimit,
  };

  if (status === "live") {
    lastSuccessfulPayload = payload;
  }

  return NextResponse.json(payload);
}

function getGithubUsername(profileUrl: string) {
  const parts = profileUrl.split("/").filter(Boolean);
  return parts.at(-1) ?? "acrostm";
}

async function fetchGithub<T>(url: string): Promise<GithubFetchResult<T>> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "jiachz-blog-about-page",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`);
  }

  return {
    data: (await response.json()) as T,
    rateLimit: readRateLimit(response.headers),
  };
}

function readSettled<T>(
  result: PromiseSettledResult<GithubFetchResult<T>>,
): GithubFetchResult<T> | undefined {
  if (result.status === "fulfilled") {
    return result.value;
  }

  return undefined;
}

function readRateLimit(headers: Headers): GithubActivityResponse["rateLimit"] {
  const remainingHeader = headers.get("x-ratelimit-remaining");
  const resetHeader = headers.get("x-ratelimit-reset");
  const remaining = remainingHeader ? Number(remainingHeader) : undefined;
  const resetAt = resetHeader
    ? new Date(Number(resetHeader) * 1000).toISOString()
    : undefined;

  return {
    remaining: Number.isFinite(remaining) ? remaining : undefined,
    resetAt,
  };
}

function normalizeProfile(
  profile: GithubUserResponse | undefined,
): GithubProfileSummary {
  return {
    login: profile?.login ?? USERNAME,
    name: profile?.name ?? undefined,
    avatarUrl: profile?.avatar_url ?? undefined,
    url: profile?.html_url ?? GITHUB_PAGE,
    bio: profile?.bio ?? undefined,
    publicRepos: profile?.public_repos ?? 0,
    followers: profile?.followers ?? 0,
    updatedAt: profile?.updated_at ?? undefined,
  };
}

function normalizeRepos(repos: GithubRepoResponse[]): GithubActivityRepo[] {
  return repos.map((repo) => ({
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description ?? undefined,
    language: repo.language ?? undefined,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    pushedAt: repo.pushed_at ?? undefined,
    updatedAt: repo.updated_at ?? undefined,
    topics: repo.topics ?? [],
  }));
}

function normalizeEvents(events: GithubEventResponse[]): GithubActivityEvent[] {
  return events.map((event, index) => {
    const detail = getEventDetail(event);

    return {
      id: event.id,
      type: event.type,
      label: EVENT_LABELS[event.type] ?? event.type.replace(/Event$/, ""),
      detail,
      repo: event.repo.name,
      repoUrl: `https://github.com/${event.repo.name}`,
      createdAt: event.created_at,
      tone: EVENT_TONES[index % EVENT_TONES.length] ?? "accent",
    };
  });
}

function getEventDetail(event: GithubEventResponse) {
  const payload = event.payload;

  if (event.type === "PushEvent") {
    const commits = getRecordArray(payload.commits);
    const firstMessage = getString(commits[0], "message")?.split("\n")[0];
    const commitText = `${commits.length} commit${commits.length > 1 ? "s" : ""}`;
    return firstMessage ? `${commitText}: ${firstMessage}` : commitText;
  }

  if (event.type === "CreateEvent") {
    const refType = getString(payload, "ref_type") ?? "resource";
    const ref = getString(payload, "ref");
    return ref ? `created ${refType} ${ref}` : `created ${refType}`;
  }

  if (event.type === "PullRequestEvent") {
    const action = getString(payload, "action") ?? "updated";
    const pullRequest = getRecord(payload.pull_request);
    const title = getString(pullRequest, "title");
    return title ? `${action}: ${title}` : action;
  }

  if (event.type === "IssuesEvent") {
    const action = getString(payload, "action") ?? "updated";
    const issue = getRecord(payload.issue);
    const title = getString(issue, "title");
    return title ? `${action}: ${title}` : action;
  }

  if (event.type === "ReleaseEvent") {
    const release = getRecord(payload.release);
    return (
      getString(release, "name") ??
      getString(release, "tag_name") ??
      "new release"
    );
  }

  return (
    getString(payload, "action") ??
    EVENT_LABELS[event.type] ??
    "public activity"
  );
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function getRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = getRecord(item);
    return record ? [record] : [];
  });
}

function getString(
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function buildStats(
  profile: GithubProfileSummary,
  repos: GithubActivityRepo[],
  events: GithubActivityEvent[],
): GithubActivityStats {
  return {
    publicRepos: profile.publicRepos,
    followers: profile.followers,
    activeRepos: new Set(events.map((event) => event.repo)).size,
    totalStars: repos.reduce((sum, repo) => sum + repo.stars, 0),
    pushEvents: events.filter((event) => event.type === "PushEvent").length,
    latestEventAt: events[0]?.createdAt,
  };
}

function buildContributionRhythm(
  events: GithubActivityEvent[],
): GithubContributionRhythm {
  const today = startOfUtcDay(new Date());
  const currentWeekStart = startOfUtcWeek(today);
  const firstDay = addUtcDays(currentWeekStart, -(CONTRIBUTION_WEEKS - 1) * 7);
  const eventMap = new Map<string, GithubActivityEvent[]>();

  events.forEach((event) => {
    const date = new Date(event.createdAt);

    if (!Number.isFinite(date.getTime())) {
      return;
    }

    const key = formatUtcDate(date);
    const bucket = eventMap.get(key) ?? [];
    bucket.push(event);
    eventMap.set(key, bucket);
  });

  const days = Array.from(
    { length: CONTRIBUTION_WEEKS * 7 },
    (_, index): GithubContributionDay => {
      const date = addUtcDays(firstDay, index);
      const key = formatUtcDate(date);
      const dayEvents = eventMap.get(key) ?? [];
      const count = dayEvents.length;

      return {
        date: key,
        count,
        level: getContributionLevel(count),
        events: dayEvents.slice(0, 3).map((event) => event.label),
        future: date.getTime() > today.getTime(),
      };
    },
  );

  const completedDays = days.filter((day) => !day.future);

  return {
    days,
    activeDays: completedDays.filter((day) => day.count > 0).length,
    longestStreak: getLongestStreak(completedDays),
    totalEvents: completedDays.reduce((sum, day) => sum + day.count, 0),
    since: days[0]?.date ?? formatUtcDate(today),
    until: formatUtcDate(today),
    source: "public-events",
    note: RHYTHM_NOTE,
  };
}

function getContributionLevel(count: number): GithubContributionDay["level"] {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count <= 3) {
    return 2;
  }

  if (count <= 6) {
    return 3;
  }

  return 4;
}

function getLongestStreak(days: GithubContributionDay[]) {
  let current = 0;
  let longest = 0;

  days.forEach((day) => {
    if (day.count > 0) {
      current += 1;
      longest = Math.max(longest, current);
      return;
    }

    current = 0;
  });

  return longest;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfUtcWeek(date: Date) {
  const start = startOfUtcDay(date);
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  return start;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function formatUtcDate(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function buildEmptyPayload(error: string): GithubActivityResponse {
  const profile = normalizeProfile(undefined);
  const rhythm = buildContributionRhythm([]);

  return {
    status: "error",
    username: USERNAME,
    fetchedAt: new Date().toISOString(),
    cacheSeconds: CACHE_SECONDS,
    latencyNote: LATENCY_NOTE,
    profile,
    events: [],
    repos: [],
    stats: buildStats(profile, [], []),
    rhythm,
    error,
  };
}

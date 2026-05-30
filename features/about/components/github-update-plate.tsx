"use client";

import React from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  CalendarDays,
  CircleDot,
  GitBranch,
  Github,
  Radio,
  RefreshCw,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { type GithubActivityResponse } from "../types";

const EVENT_TONE_CLASSES: Record<string, string> = {
  accent: "border-[var(--future-accent)] bg-[var(--future-accent-soft)]",
  cyan: "border-[var(--future-cyan)] bg-[var(--future-cyan-soft)]",
  gold: "border-[var(--future-gold)] bg-[var(--future-gold-soft)]",
  rose: "border-pink-400/40 bg-pink-400/10",
};

const RHYTHM_LEVEL_CLASSES = [
  "border-[var(--future-line)] bg-white/[0.045]",
  "border-emerald-400/20 bg-emerald-400/20",
  "border-[color:var(--future-cyan)] bg-[var(--future-cyan-soft)]",
  "border-[color:var(--future-accent)] bg-[var(--future-accent-soft)]",
  "border-[color:var(--future-gold)] bg-[var(--future-gold)] shadow-[0_0_18px_rgb(227_173_93/0.26)]",
] as const;

type RequestState = "loading" | "ready" | "failed";

export const GithubUpdatePlate = () => {
  const [activity, setActivity] = React.useState<GithubActivityResponse | null>(
    null,
  );
  const [requestState, setRequestState] =
    React.useState<RequestState>("loading");

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      setRequestState("loading");

      try {
        const response = await fetch("/api/github/activity", {
          signal: controller.signal,
        });
        const payload = (await response.json()) as GithubActivityResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "GitHub activity request failed");
        }

        setActivity(payload);
        setRequestState("ready");
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState("failed");
      }
    }

    void loadActivity();

    return () => controller.abort();
  }, []);

  const events = activity?.events ?? [];
  const repos = activity?.repos ?? [];
  const statusText = activity ? getStatusText(activity.status) : "Loading";
  const hasActivity = events.length > 0 || repos.length > 0;

  return (
    <section
      data-about-reveal
      className="future-panel-strong relative isolate overflow-hidden rounded-[2rem] p-5 md:p-6"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,var(--future-cyan-soft),transparent_24rem),radial-gradient(circle_at_88%_28%,var(--future-accent-soft),transparent_18rem)]" />

      <div className="flex flex-col gap-4 border-b border-[var(--future-line)] pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-ink)]">
              <Github className="size-5" />
            </span>
            <span className="future-label">GitHub Update Plate</span>
          </div>
          <h2 className="text-3xl font-black leading-tight text-[var(--future-ink)] md:text-4xl">
            公开动态，不做静态履历
          </h2>
          <p className="future-muted mt-3 max-w-2xl text-sm leading-6 md:text-base">
            自动读取 @{activity?.username ?? "acrostm"} 的 public events
            和活跃仓库。 GitHub 官方公开事件存在延迟，所以这里标记为准实时。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-[var(--future-line)] bg-white/[0.05] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[var(--future-muted)]"
          >
            <span
              className={cn(
                "mr-2 size-2 rounded-full",
                requestState === "loading"
                  ? "animate-pulse bg-[var(--future-gold)]"
                  : "bg-[var(--future-cyan)]",
              )}
            />
            {statusText}
          </Badge>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-[var(--future-line)] bg-white/[0.04]"
          >
            <Link
              href={activity?.profile.url ?? "https://github.com/acrostm"}
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub
              <ArrowUpRight className="ml-2 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,0.95fr)]">
        <div className="rounded-3xl border border-[var(--future-line)] bg-black/[0.08] p-4 dark:bg-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="future-label">Recent signal</p>
            <p className="font-mono text-xs text-[var(--future-muted)]">
              {activity?.fetchedAt
                ? `Fetched ${formatRelativeTime(activity.fetchedAt)}`
                : "Waiting for API"}
            </p>
          </div>

          {requestState === "loading" && <GithubActivitySkeleton />}

          {requestState !== "loading" && events.length === 0 && (
            <EmptyGithubState
              failed={requestState === "failed" || activity?.status === "error"}
            />
          )}

          {events.length > 0 && (
            <ol className="space-y-3">
              {events.slice(0, 6).map((event, index) => (
                <li
                  key={event.id}
                  className="group grid grid-cols-[4rem_auto_minmax(0,1fr)] gap-3"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="pt-3 font-mono text-xs tabular-nums text-[var(--future-muted)]">
                    {formatRelativeTime(event.createdAt)}
                  </span>
                  <span
                    className={cn(
                      "mt-2 grid size-7 place-items-center rounded-full border",
                      EVENT_TONE_CLASSES[event.tone],
                    )}
                  >
                    <CircleDot className="size-3.5" />
                  </span>
                  <Link
                    href={event.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-transparent bg-white/[0.04] p-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--future-accent)] hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-[var(--future-ink)]">
                        {event.label}
                      </span>
                      <span className="rounded-full border border-[var(--future-line)] px-2 py-0.5 font-mono text-[0.68rem] text-[var(--future-accent)]">
                        {event.repo}
                      </span>
                    </div>
                    <p className="future-muted mt-2 line-clamp-2 text-sm leading-6">
                      {event.detail}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

        <ContributionRhythmCard
          activity={activity}
          loading={requestState === "loading"}
        />
      </div>

      <p className="future-muted mt-5 text-xs leading-5">
        {activity?.latencyNote ??
          "GitHub public events are cached for this page."}
        {hasActivity ? " UI 会定期重新读取服务端缓存。" : ""}
      </p>
    </section>
  );
};

type ContributionRhythmCardProps = {
  activity: GithubActivityResponse | null;
  loading: boolean;
};

const ContributionRhythmCard = ({
  activity,
  loading,
}: ContributionRhythmCardProps) => {
  const rhythm = activity?.rhythm;
  const stats = activity?.stats;
  const repos = activity?.repos ?? [];

  return (
    <aside className="rounded-3xl border border-[var(--future-line)] bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-[var(--future-accent)]" />
          <p className="future-label">贡献节奏</p>
        </div>
        <span className="font-mono text-xs text-[var(--future-muted)]">
          {rhythm ? `${rhythm.longestStreak} 天最高连击` : "public events"}
        </span>
      </div>

      {loading ? (
        <ContributionRhythmSkeleton />
      ) : (
        <ContributionHeatmap days={rhythm?.days ?? []} />
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <GithubStat
          icon={GitBranch}
          label="Public repos"
          value={stats?.publicRepos ?? 0}
          loading={loading}
        />
        <GithubStat
          icon={Radio}
          label="Active repos"
          value={stats?.activeRepos ?? 0}
          loading={loading}
        />
        <GithubStat
          icon={Star}
          label="Stars tracked"
          value={stats?.totalStars ?? 0}
          loading={loading}
        />
        <GithubStat
          icon={RefreshCw}
          label="Public events"
          value={rhythm?.totalEvents ?? stats?.pushEvents ?? 0}
          loading={loading}
        />
      </div>

      <div className="mt-5 border-t border-[var(--future-line)] pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="future-label">Active repo chips</p>
          <span className="font-mono text-xs text-[var(--future-muted)]">
            {activity?.rateLimit?.remaining !== undefined
              ? `${activity.rateLimit.remaining} api left`
              : "cached"}
          </span>
        </div>

        {loading && (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-2xl bg-white/[0.07]"
              />
            ))}
          </div>
        )}

        {!loading && repos.length === 0 && (
          <p className="future-muted rounded-2xl border border-dashed border-[var(--future-line)] p-4 text-sm leading-6">
            暂时没有拿到公开仓库数据，页面会继续保持可用。
          </p>
        )}

        {!loading && repos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {repos.slice(0, 6).map((repo) => (
              <Link
                key={repo.fullName}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-[var(--future-line)] bg-black/[0.08] px-3 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--future-cyan)] hover:bg-white/[0.08] dark:bg-black/20"
              >
                <span className="max-w-36 truncate font-mono text-xs font-semibold text-[var(--future-ink)]">
                  {repo.name}
                </span>
                {repo.language && (
                  <span className="rounded-full border border-[var(--future-line)] px-2 py-0.5 font-mono text-[0.62rem] text-[var(--future-muted)]">
                    {repo.language}
                  </span>
                )}
                <ArrowUpRight className="size-3 shrink-0 text-[var(--future-muted)] group-hover:text-[var(--future-cyan)]" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {rhythm?.note && (
        <p className="future-muted mt-4 text-xs leading-5">{rhythm.note}</p>
      )}
    </aside>
  );
};

type GithubStatProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  loading: boolean;
};

const GithubStat = ({ icon: Icon, label, value, loading }: GithubStatProps) => {
  return (
    <div className="rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--future-muted)]">
          {label}
        </p>
        <Icon className="size-4 text-[var(--future-accent)]" />
      </div>
      {loading ? (
        <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-white/[0.08]" />
      ) : (
        <p className="mt-3 font-mono text-2xl font-black text-[var(--future-ink)]">
          {formatCount(value)}
        </p>
      )}
    </div>
  );
};

type ContributionHeatmapProps = {
  days: GithubActivityResponse["rhythm"]["days"];
};

const ContributionHeatmap = ({ days }: ContributionHeatmapProps) => {
  if (!days.length) {
    return (
      <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-[var(--future-line)] p-5 text-center">
        <p className="future-muted max-w-xs text-sm leading-6">
          暂时没有公开事件可用于绘制节奏图。
        </p>
      </div>
    );
  }

  const weeks = chunkDays(days);

  return (
    <div className="rounded-2xl border border-[var(--future-line)] bg-black/[0.08] p-3 dark:bg-black/20">
      <div
        className="mb-2 grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
        }}
      >
        {weeks.map((week, index) => (
          <span
            key={`${week[0]?.date ?? index}-label`}
            className="truncate font-mono text-[0.58rem] text-[var(--future-muted)]"
          >
            {getWeekMonthLabel(week, index)}
          </span>
        ))}
      </div>

      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {weeks.map((week) =>
          week.map((day) => (
            <span
              key={day.date}
              aria-label={`${day.date}: ${day.count} public events`}
              title={`${day.date}: ${day.count} public events${
                day.events.length ? ` - ${day.events.join(", ")}` : ""
              }`}
              className={cn(
                "aspect-square min-w-0 rounded-[3px] border transition duration-200 hover:scale-125",
                RHYTHM_LEVEL_CLASSES[day.level],
                day.future && "opacity-25",
              )}
            />
          )),
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[0.65rem] text-[var(--future-muted)]">
        <span>Less</span>
        <span className="flex items-center gap-1">
          {RHYTHM_LEVEL_CLASSES.map((className, index) => (
            <span
              key={className}
              className={cn(
                "block size-3 rounded-[3px] border",
                className,
                index === 0 && "opacity-70",
              )}
            />
          ))}
        </span>
        <span>More</span>
      </div>
    </div>
  );
};

const ContributionRhythmSkeleton = () => {
  return (
    <div className="rounded-2xl border border-[var(--future-line)] bg-black/[0.08] p-3 dark:bg-black/20">
      <div className="mb-2 grid grid-cols-6 gap-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="h-3 animate-pulse rounded bg-white/[0.07]"
          />
        ))}
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {Array.from({ length: 26 * 7 }).map((_, index) => (
          <span
            key={index}
            className="aspect-square rounded-[3px] bg-white/[0.06] motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};

const GithubActivitySkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <span className="mt-1 size-8 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="rounded-2xl bg-white/[0.05] p-3">
            <div className="h-4 w-36 animate-pulse rounded bg-white/[0.08]" />
            <div className="mt-3 h-3 w-48 animate-pulse rounded bg-white/[0.08]" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/[0.08]" />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyGithubState = ({ failed }: { failed: boolean }) => {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--future-line)] p-5">
      <p className="text-base font-semibold text-[var(--future-ink)]">
        {failed ? "GitHub 暂时没有响应" : "还没有公开事件"}
      </p>
      <p className="future-muted mt-2 text-sm leading-6">
        面板会保持页面可读，并在下一次服务端缓存刷新时重新尝试读取公开动态。
      </p>
    </div>
  );
};

function getStatusText(status: GithubActivityResponse["status"]) {
  if (status === "live") {
    return "Live-ish";
  }

  if (status === "partial") {
    return "Partial";
  }

  if (status === "stale") {
    return "Stale cache";
  }

  return "Fallback";
}

function formatCount(value: number | string) {
  if (typeof value === "string") {
    return value;
  }

  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function chunkDays(days: GithubActivityResponse["rhythm"]["days"]) {
  const weeks: Array<GithubActivityResponse["rhythm"]["days"]> = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function getWeekMonthLabel(
  week: GithubActivityResponse["rhythm"]["days"],
  index: number,
) {
  const firstDayOfMonth = week.find((day) => day.date.endsWith("-01"));
  const date =
    firstDayOfMonth?.date ?? (index === 0 ? week[0]?.date : undefined);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value).getTime();

  if (!Number.isFinite(date)) {
    return "recently";
  }

  const diffSeconds = Math.round((date - Date.now()) / 1000);
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: "year", seconds: 31_536_000 },
    { unit: "month", seconds: 2_592_000 },
    { unit: "day", seconds: 86_400 },
    { unit: "hour", seconds: 3_600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];
  const selectedUnit =
    units.find((item) => Math.abs(diffSeconds) >= item.seconds) ??
    ({ unit: "second", seconds: 1 } satisfies {
      unit: Intl.RelativeTimeFormatUnit;
      seconds: number;
    });

  return new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" }).format(
    Math.round(diffSeconds / selectedUnit.seconds),
    selectedUnit.unit,
  );
}

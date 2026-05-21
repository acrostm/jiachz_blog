"use client";

import React from "react";

import Link from "next/link";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Flame,
  GripVertical,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  Rss,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import type {
  NewsItem,
  NewsItemsResponse,
  NewsPreference,
  NewsSource,
  SavedNewsItem,
} from "../types";

gsap.registerPlugin(useGSAP);

type NewsPageProps = {
  sources: NewsSource[];
};

type NewsTab = "followed" | "hottest" | "realtime";

type SourceFeedState = {
  items: NewsItem[];
  status?: NewsItemsResponse["status"];
  updatedTime?: number;
  error?: string;
  isFetching: boolean;
  isRefreshing: boolean;
};

const NEWS_PREVIEW_LIMIT = 7;

const sourceTone: Record<NewsSource["color"], string> = {
  blue: "border-blue-400/30 bg-blue-400/10 text-blue-600 dark:text-blue-200",
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
  emerald:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  gray: "border-zinc-400/30 bg-zinc-400/10 text-zinc-700 dark:text-zinc-200",
  green:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  indigo:
    "border-indigo-400/30 bg-indigo-400/10 text-indigo-700 dark:text-indigo-200",
  orange:
    "border-orange-400/30 bg-orange-400/10 text-orange-700 dark:text-orange-200",
  red: "border-red-400/30 bg-red-400/10 text-red-700 dark:text-red-200",
  slate:
    "border-slate-400/30 bg-slate-400/10 text-slate-700 dark:text-slate-200",
  teal: "border-teal-400/30 bg-teal-400/10 text-teal-700 dark:text-teal-200",
};

const sourceCardTone: Record<NewsSource["color"], string> = {
  blue: "border-blue-400/20 bg-blue-400/[0.055] hover:border-blue-400/40",
  cyan: "border-cyan-400/20 bg-cyan-400/[0.055] hover:border-cyan-400/40",
  emerald:
    "border-emerald-400/20 bg-emerald-400/[0.055] hover:border-emerald-400/40",
  gray: "border-zinc-400/20 bg-zinc-400/[0.055] hover:border-zinc-400/40",
  green:
    "border-emerald-400/20 bg-emerald-400/[0.055] hover:border-emerald-400/40",
  indigo:
    "border-indigo-400/20 bg-indigo-400/[0.055] hover:border-indigo-400/40",
  orange:
    "border-orange-400/20 bg-orange-400/[0.055] hover:border-orange-400/40",
  red: "border-red-400/20 bg-red-400/[0.055] hover:border-red-400/40",
  slate: "border-slate-400/20 bg-slate-400/[0.055] hover:border-slate-400/40",
  teal: "border-teal-400/20 bg-teal-400/[0.055] hover:border-teal-400/40",
};

const itemBadgeTone: Record<
  Exclude<
    NonNullable<NonNullable<NewsItem["extra"]>["badges"]>[number]["tone"],
    undefined
  >,
  string
> = {
  default:
    "border-[var(--future-line)] bg-white/[0.08] text-[var(--future-muted)]",
  exclusive: "border-pink-300/40 bg-pink-400/90 text-white",
  hot: "border-red-300/40 bg-red-500/90 text-white",
  live: "border-cyan-300/40 bg-cyan-400/90 text-slate-950",
  new: "border-amber-300/40 bg-amber-400/90 text-slate-950",
};

const tabCopy: Record<NewsTab, { label: string; description: string }> = {
  followed: {
    label: "关注",
    description: "你标注关注的新闻源，可直接拖拽排序。",
  },
  hottest: {
    label: "最热",
    description: "按来源原始热度顺序展示。",
  },
  realtime: {
    label: "实时",
    description: "按来源最新发布时间展示。",
  },
};

const parseTimestamp = (value?: number | string | null) => {
  if (!value) return 0;

  return typeof value === "number"
    ? value
    : Number.isNaN(Number(value))
      ? Date.parse(value)
      : Number(value);
};

const padTimePart = (value: number) => String(value).padStart(2, "0");

const formatClockTime = (timestamp: number, includeDate = false) => {
  const date = new Date(timestamp);
  const time = [
    padTimePart(date.getHours()),
    padTimePart(date.getMinutes()),
    padTimePart(date.getSeconds()),
  ].join(":");

  if (!includeDate) return time;

  return `${padTimePart(date.getMonth() + 1)}-${padTimePart(date.getDate())} ${time}`;
};

const formatRelativeTime = (value?: number | string | null) => {
  const timestamp = parseTimestamp(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) return "尚未更新";

  const diff = Math.max(0, Date.now() - timestamp);
  const minute = Math.floor(diff / 60_000);
  if (minute < 1) return "刚刚";
  if (minute < 60) return `${minute} 分钟前`;
  const hour = Math.floor(minute / 60);
  if (hour < 24) return `${hour} 小时前`;
  return `${Math.floor(hour / 24)} 天前`;
};

const formatRealtimeItemTime = (value?: number | string | null) => {
  const timestamp = parseTimestamp(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) return "--";

  const diffInSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  );

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  }

  if (diffInSeconds < 60 * 60) {
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${minutes}分${seconds}秒前`;
  }

  if (diffInSeconds < 24 * 60 * 60) {
    return formatClockTime(timestamp);
  }

  return formatClockTime(timestamp, true);
};

const getItemKey = (sourceId: string, itemId: string | number) =>
  `${sourceId}:${String(itemId)}`;

const createDefaultPreference = (sources: NewsSource[]): NewsPreference => ({
  sourceOrder: sources.map((source) => source.id),
  hiddenSources: [],
  defaultColumn: null,
});

const createIdleFeedState = (): SourceFeedState => ({
  items: [],
  isFetching: false,
  isRefreshing: false,
});

const getCompleteSourceOrder = (
  sources: NewsSource[],
  sourceOrder: string[],
) => {
  const validSourceIds = new Set(sources.map((source) => source.id));
  const orderedIds = sourceOrder.filter((sourceId) =>
    validSourceIds.has(sourceId),
  );

  return [
    ...orderedIds,
    ...sources
      .map((source) => source.id)
      .filter((sourceId) => !orderedIds.includes(sourceId)),
  ];
};

const sortSources = (sources: NewsSource[], sourceOrder: string[]) => {
  const order = new Map(
    sourceOrder.map((sourceId, index) => [sourceId, index]),
  );

  return [...sources].sort((first, second) => {
    const firstIndex = order.get(first.id) ?? Number.MAX_SAFE_INTEGER;
    const secondIndex = order.get(second.id) ?? Number.MAX_SAFE_INTEGER;
    return firstIndex - secondIndex;
  });
};

const getFollowedSources = (
  sources: NewsSource[],
  preference: NewsPreference,
) =>
  sortSources(sources, preference.sourceOrder).filter(
    (source) => !preference.hiddenSources.includes(source.id),
  );

const getStatusLabel = (status?: NewsItemsResponse["status"]) => {
  if (status === "success") return "Live";
  if (status === "rate_limited") return "Limited";
  if (status === "empty") return "Empty";
  return "Cache";
};

const getSourceTypeLabel = (type: NewsSource["type"]) =>
  type === "hottest" ? "最热" : "实时";

const createFollowPreference = ({
  sources,
  preference,
  sourceId,
  followed,
}: {
  sources: NewsSource[];
  preference: NewsPreference;
  sourceId: string;
  followed: boolean;
}): NewsPreference => {
  const completeOrder = getCompleteSourceOrder(sources, preference.sourceOrder);
  const withoutSource = completeOrder.filter((id) => id !== sourceId);

  if (!followed) {
    return {
      ...preference,
      sourceOrder: completeOrder,
      hiddenSources: Array.from(
        new Set([...preference.hiddenSources, sourceId]),
      ),
    };
  }

  const hiddenSources = preference.hiddenSources.filter(
    (id) => id !== sourceId,
  );
  const followedIds = withoutSource.filter(
    (id) => !preference.hiddenSources.includes(id),
  );
  const otherIds = withoutSource.filter((id) => !followedIds.includes(id));

  return {
    ...preference,
    sourceOrder: [...followedIds, sourceId, ...otherIds],
    hiddenSources,
  };
};

const createReorderedFollowPreference = ({
  sources,
  preference,
  sourceId,
  targetSourceId,
}: {
  sources: NewsSource[];
  preference: NewsPreference;
  sourceId: string;
  targetSourceId: string;
}): NewsPreference | null => {
  if (sourceId === targetSourceId) return null;

  const followedIds = getFollowedSources(sources, preference).map(
    (source) => source.id,
  );
  const sourceIndex = followedIds.indexOf(sourceId);
  const targetIndex = followedIds.indexOf(targetSourceId);

  if (sourceIndex < 0 || targetIndex < 0) return null;

  const nextFollowedIds = [...followedIds];
  const [source] = nextFollowedIds.splice(sourceIndex, 1);
  if (!source) return null;
  const insertIndex = nextFollowedIds.indexOf(targetSourceId);
  nextFollowedIds.splice(insertIndex, 0, source);

  const completeOrder = getCompleteSourceOrder(sources, preference.sourceOrder);
  const otherIds = completeOrder.filter((id) => !nextFollowedIds.includes(id));

  return {
    ...preference,
    sourceOrder: [...nextFollowedIds, ...otherIds],
  };
};

export const NewsPage = ({ sources }: NewsPageProps) => {
  const scope = React.useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const defaultPreference = React.useMemo(
    () => createDefaultPreference(sources),
    [sources],
  );
  const [preference, setPreference] =
    React.useState<NewsPreference>(defaultPreference);
  const [activeTab, setActiveTab] = React.useState<NewsTab>("followed");
  const [feedStates, setFeedStates] = React.useState<
    Record<string, SourceFeedState>
  >({});
  const [savedItems, setSavedItems] = React.useState<SavedNewsItem[]>([]);
  const [isBootstrapping, setIsBootstrapping] = React.useState(false);
  const [isSavingPreference, setIsSavingPreference] = React.useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = React.useState(false);
  const [draggingSourceId, setDraggingSourceId] = React.useState<string | null>(
    null,
  );

  const followedSources = React.useMemo(
    () => getFollowedSources(sources, preference),
    [preference, sources],
  );
  const hottestSources = React.useMemo(
    () => sources.filter((source) => source.type === "hottest"),
    [sources],
  );
  const realtimeSources = React.useMemo(
    () => sources.filter((source) => source.type === "realtime"),
    [sources],
  );
  const followedSourceIds = React.useMemo(
    () => new Set(followedSources.map((source) => source.id)),
    [followedSources],
  );
  const displayedSources = React.useMemo(() => {
    if (activeTab === "followed") return followedSources;
    if (activeTab === "hottest") return hottestSources;
    return realtimeSources;
  }, [activeTab, followedSources, hottestSources, realtimeSources]);
  const savedKeys = React.useMemo(
    () =>
      new Set(savedItems.map((item) => getItemKey(item.sourceId, item.itemId))),
    [savedItems],
  );
  const loadedSourceCount = React.useMemo(
    () =>
      displayedSources.filter((source) => feedStates[source.id]?.items.length)
        .length,
    [displayedSources, feedStates],
  );
  const isAnySourceFetching = displayedSources.some(
    (source) => feedStates[source.id]?.isFetching,
  );
  const canLoadSources = isAuthenticated && !authLoading && !isBootstrapping;

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set("[data-news-reveal]", { autoAlpha: 1 });
        return;
      }

      gsap.fromTo(
        "[data-news-reveal]",
        { autoAlpha: 0, y: 20, filter: "blur(10px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.64,
          ease: "power3.out",
          stagger: 0.035,
        },
      );
    },
    { scope },
  );

  const fetchSource = React.useCallback(
    async (
      sourceId: string,
      latest = false,
      options: { notify?: boolean } = {},
    ) => {
      if (!isAuthenticated || !sourceId) return null;

      setFeedStates((current) => {
        const previous = current[sourceId] ?? createIdleFeedState();

        return {
          ...current,
          [sourceId]: {
            ...previous,
            error: undefined,
            isFetching: true,
            isRefreshing: latest,
          },
        };
      });

      try {
        const params = new URLSearchParams({
          source: sourceId,
        });

        if (latest) params.set("latest", "true");

        const response = await fetch(`/api/news/items?${params.toString()}`);
        const data = (await response.json()) as
          | NewsItemsResponse
          | { message: string };

        if (!response.ok || "message" in data) {
          throw new Error("message" in data ? data.message : "加载失败");
        }

        setFeedStates((current) => ({
          ...current,
          [sourceId]: {
            items: data.items,
            status: data.status,
            updatedTime: data.updatedTime,
            error: data.error,
            isFetching: false,
            isRefreshing: false,
          },
        }));

        if (options.notify !== false && latest) {
          if (data.status === "rate_limited") {
            toast.info("刷新太频繁，已返回最近缓存");
          } else if (data.status === "success") {
            toast.success("新闻源已刷新");
          }
        }

        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "加载失败";

        setFeedStates((current) => {
          const previous = current[sourceId] ?? createIdleFeedState();

          return {
            ...current,
            [sourceId]: {
              ...previous,
              error: message,
              isFetching: false,
              isRefreshing: false,
            },
          };
        });

        if (options.notify !== false) {
          toast.error(message);
        }

        return null;
      }
    },
    [isAuthenticated],
  );

  const persistPreference = React.useCallback(
    async (
      nextPreference: NewsPreference,
      previousPreference: NewsPreference,
      successMessage: string,
    ) => {
      setPreference(nextPreference);
      setIsSavingPreference(true);

      try {
        const response = await fetch("/api/news/me/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextPreference),
        });

        if (!response.ok) {
          throw new Error("保存关注失败");
        }

        const data = (await response.json()) as NewsPreference;
        setPreference(data);
        toast.success(successMessage);
      } catch (error) {
        setPreference(previousPreference);
        toast.error(error instanceof Error ? error.message : "保存关注失败");
      } finally {
        setIsSavingPreference(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setPreference(defaultPreference);
      setFeedStates({});
      setSavedItems([]);
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    const bootstrapNews = async () => {
      setIsBootstrapping(true);

      const [preferenceResult, savedResult] = await Promise.allSettled([
        fetch("/api/news/me/preferences"),
        fetch("/api/news/me/saved"),
      ]);

      if (cancelled) return;

      let nextPreference = defaultPreference;
      if (
        preferenceResult.status === "fulfilled" &&
        preferenceResult.value.ok
      ) {
        nextPreference =
          (await preferenceResult.value.json()) as NewsPreference;
      }

      let nextSavedItems: SavedNewsItem[] = [];
      if (savedResult.status === "fulfilled" && savedResult.value.ok) {
        const data = (await savedResult.value.json()) as {
          items: SavedNewsItem[];
        };
        nextSavedItems = data.items;
      }

      setPreference(nextPreference);
      setSavedItems(nextSavedItems);

      if (!cancelled) {
        setIsBootstrapping(false);
      }
    };

    void bootstrapNews();

    return () => {
      cancelled = true;
    };
  }, [authLoading, defaultPreference, isAuthenticated]);

  React.useEffect(() => {
    if (!canLoadSources || !displayedSources.length) return;

    const missingSources = displayedSources.filter((source) => {
      const state = feedStates[source.id];
      return (
        !state?.items.length &&
        !state?.isFetching &&
        !state?.error &&
        !state?.status
      );
    });

    if (!missingSources.length) return;

    void Promise.allSettled(
      missingSources.map((source) =>
        fetchSource(source.id, false, { notify: false }),
      ),
    );
  }, [canLoadSources, displayedSources, feedStates, fetchSource]);

  const refreshVisibleSources = async () => {
    if (!displayedSources.length) return;

    setIsRefreshingAll(true);

    await Promise.allSettled(
      displayedSources.map((source) =>
        fetchSource(source.id, true, { notify: false }),
      ),
    );

    setIsRefreshingAll(false);
    toast.success("当前列表已刷新");
  };

  const toggleFollowedSource = (sourceId: string, followed: boolean) => {
    const previousPreference = preference;
    const nextPreference = createFollowPreference({
      sources,
      preference,
      sourceId,
      followed,
    });

    void persistPreference(
      nextPreference,
      previousPreference,
      followed ? "已关注新闻源" : "已取消关注",
    );
  };

  const reorderFollowedSource = (sourceId: string, targetSourceId: string) => {
    const previousPreference = preference;
    const nextPreference = createReorderedFollowPreference({
      sources,
      preference,
      sourceId,
      targetSourceId,
    });

    if (!nextPreference) return;

    void persistPreference(
      nextPreference,
      previousPreference,
      "关注顺序已保存",
    );
  };

  const toggleSaved = async (source: NewsSource, item: NewsItem) => {
    if (!isAuthenticated) {
      toast.info("登录后可收藏新闻");
      return;
    }

    const key = getItemKey(source.id, item.id);

    if (savedKeys.has(key)) {
      const params = new URLSearchParams({
        sourceId: source.id,
        itemId: String(item.id),
      });
      const response = await fetch(`/api/news/me/saved?${params.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("取消收藏失败");
        return;
      }

      setSavedItems((current) =>
        current.filter(
          (saved) => getItemKey(saved.sourceId, saved.itemId) !== key,
        ),
      );
      return;
    }

    const response = await fetch("/api/news/me/saved", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceId: source.id,
        item,
      }),
    });

    if (!response.ok) {
      toast.error("收藏失败");
      return;
    }

    const data = (await response.json()) as { item: SavedNewsItem };
    setSavedItems((current) => [data.item, ...current]);
  };

  if (authLoading) {
    return <NewsLoadingShell />;
  }

  if (!isAuthenticated) {
    return <NewsGuestGate />;
  }

  return (
    <div
      ref={scope}
      className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-8 sm:px-8 lg:px-12"
    >
      <section
        data-news-reveal
        className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--future-line)] pb-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.05] text-[var(--future-accent)]">
            <Rss className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black leading-5">NewsNow</h1>
            <p className="future-muted truncate text-xs">
              {displayedSources.length} 个来源 · {loadedSourceCount} 个已载入 ·{" "}
              {savedItems.length} 条收藏
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full border-[var(--future-line)] bg-white/[0.04] px-3 text-[var(--future-ink)]"
            onClick={refreshVisibleSources}
            disabled={
              isRefreshingAll ||
              isBootstrapping ||
              isAnySourceFetching ||
              !displayedSources.length
            }
          >
            {isRefreshingAll ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            刷新可见
          </Button>
        </div>
      </section>

      <div
        data-news-reveal
        className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
      >
        {(
          [
            ["followed", followedSources.length],
            ["hottest", hottestSources.length],
            ["realtime", realtimeSources.length],
          ] as const
        ).map(([tab, count]) => (
          <Button
            key={tab}
            type="button"
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9 shrink-0 rounded-full px-4",
              activeTab === tab &&
                "bg-[var(--future-accent)] text-white hover:bg-[var(--future-accent)]/90",
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "hottest" && <Flame className="mr-2 size-4" />}
            {tab === "realtime" && <Clock3 className="mr-2 size-4" />}
            {tab === "followed" && <Star className="mr-2 size-4" />}
            {tabCopy[tab].label}
            <span className="ml-2 font-mono text-xs opacity-70">{count}</span>
          </Button>
        ))}
      </div>
      {isBootstrapping && !loadedSourceCount ? (
        <NewsSkeletonGrid />
      ) : displayedSources.length ? (
        <main
          data-news-reveal
          className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {displayedSources.map((source) => (
            <NewsSourceCard
              key={source.id}
              source={source}
              feed={feedStates[source.id] ?? createIdleFeedState()}
              savedKeys={savedKeys}
              isFollowed={followedSourceIds.has(source.id)}
              canDrag={activeTab === "followed" && followedSources.length > 1}
              isDragging={draggingSourceId === source.id}
              isSavingFollow={isSavingPreference}
              onRefresh={() => fetchSource(source.id, true)}
              onToggleFollow={(followed) =>
                toggleFollowedSource(source.id, followed)
              }
              onDragStart={() => setDraggingSourceId(source.id)}
              onDragEnd={() => setDraggingSourceId(null)}
              onDrop={() => {
                if (draggingSourceId) {
                  reorderFollowedSource(draggingSourceId, source.id);
                }
                setDraggingSourceId(null);
              }}
              onToggleSaved={(item) => toggleSaved(source, item)}
            />
          ))}
        </main>
      ) : (
        <EmptyFollowedSources onBrowseHottest={() => setActiveTab("hottest")} />
      )}
    </div>
  );
};

const NewsSourceCard = ({
  source,
  feed,
  savedKeys,
  isFollowed,
  canDrag,
  isDragging,
  isSavingFollow,
  onRefresh,
  onToggleFollow,
  onDragStart,
  onDragEnd,
  onDrop,
  onToggleSaved,
}: {
  source: NewsSource;
  feed: SourceFeedState;
  savedKeys: Set<string>;
  isFollowed: boolean;
  canDrag: boolean;
  isDragging: boolean;
  isSavingFollow: boolean;
  onRefresh: () => void;
  onToggleFollow: (followed: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onToggleSaved: (item: NewsItem) => void;
}) => {
  const visibleItems = feed.items;

  return (
    <Card
      draggable={canDrag}
      className={cn(
        "flex h-[430px] flex-col overflow-hidden rounded-lg p-3 transition-[border-color,background-color,transform,opacity]",
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "scale-[0.99] opacity-55",
        sourceCardTone[source.color],
      )}
      onDragStart={(event) => {
        if (!canDrag) return;
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(event) => {
        if (!canDrag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        if (!canDrag) return;
        event.preventDefault();
        onDrop();
      }}
    >
      <div className="mb-2 flex shrink-0 items-center gap-2">
        {canDrag && (
          <span className="grid size-8 place-items-center rounded-md border border-[var(--future-line)] bg-white/[0.04]">
            <GripVertical className="size-4 text-[var(--future-muted)]" />
          </span>
        )}
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full border text-sm font-black",
            sourceTone[source.color],
          )}
        >
          {source.name.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-black leading-5">
              {source.name}
            </h2>
            {source.title && (
              <Badge
                variant="secondary"
                className={cn(
                  "h-6 shrink-0 rounded-md border px-1.5 text-[11px] font-semibold leading-none",
                  sourceTone[source.color],
                )}
              >
                {source.title}
              </Badge>
            )}
          </div>
          <div className="future-muted mt-0.5 flex min-w-0 items-center gap-2 text-[11px]">
            <span className="shrink-0">
              {formatRelativeTime(feed.updatedTime)}更新
            </span>
            <span className="size-1 shrink-0 rounded-full bg-current opacity-40" />
            <span className="shrink-0">{getSourceTypeLabel(source.type)}</span>
            <span className="size-1 shrink-0 rounded-full bg-current opacity-40" />
            <span className="truncate">
              {getStatusLabel(feed.status)} · {visibleItems.length}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
                onClick={() => onToggleFollow(!isFollowed)}
                disabled={isSavingFollow}
                aria-label={isFollowed ? "取消关注" : "关注来源"}
              >
                <Star
                  className={cn(
                    "size-4",
                    isFollowed &&
                      "fill-[var(--future-accent)] text-[var(--future-accent)]",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFollowed ? "取消关注" : "关注"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
                onClick={onRefresh}
                disabled={feed.isFetching}
                aria-label={`刷新 ${source.name}`}
              >
                {feed.isRefreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>刷新</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
              >
                <Link
                  href={source.home}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`打开 ${source.name}`}
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>源站</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {feed.error && (
        <div className="mb-2 shrink-0 rounded-md border border-[var(--future-line)] bg-[var(--future-accent-soft)] px-3 py-2 text-xs text-[var(--future-ink)]">
          {feed.error}
        </div>
      )}

      <div className="min-h-0 flex-1 divide-y divide-[var(--future-line)] overflow-y-auto overscroll-contain rounded-lg border border-[var(--future-line)] bg-black/[0.08]">
        {feed.isFetching && !feed.items.length ? (
          <NewsRowsSkeleton type={source.type} />
        ) : visibleItems.length ? (
          visibleItems.map((item, index) => (
            <CompactNewsRow
              key={`${source.id}-${item.id}`}
              index={index}
              item={item}
              source={source}
              saved={savedKeys.has(getItemKey(source.id, item.id))}
              onToggleSaved={() => onToggleSaved(item)}
            />
          ))
        ) : (
          <div className="grid h-full place-items-center p-5 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.04]">
                <Rss className="size-5 text-[var(--future-accent)]" />
              </div>
              <p className="future-muted mt-3 text-sm">暂无缓存内容</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const NewsItemBadges = ({ item }: { item: NewsItem }) => {
  const badges = item.extra?.badges;

  if (!badges?.length) return null;

  return (
    <>
      {badges.slice(0, 3).map((badge, index) => {
        const tone = badge.tone ?? "default";

        return (
          <span
            key={`${badge.label}-${index}`}
            className={cn(
              "ml-1 inline-flex h-5 translate-y-[-1px] items-center rounded border px-1.5 text-[11px] font-black leading-none",
              itemBadgeTone[tone],
            )}
          >
            {badge.label}
          </span>
        );
      })}
    </>
  );
};

const CompactNewsRow = ({
  index,
  item,
  source,
  saved,
  onToggleSaved,
}: {
  index: number;
  item: NewsItem;
  source: NewsSource;
  saved: boolean;
  onToggleSaved: () => void;
}) => {
  const itemSummary =
    typeof item.extra?.info === "string" ? item.extra.info : item.extra?.hover;
  const timeText = formatRealtimeItemTime(item.pubDate ?? item.extra?.date);
  const isHot = source.type === "hottest";

  return (
    <article
      className={cn(
        "group grid gap-2.5 p-3 transition-colors hover:bg-white/[0.06]",
        isHot ? "grid-cols-[2rem_minmax(0,1fr)_auto]" : "grid-cols-[1fr_auto]",
      )}
    >
      {isHot && (
        <div className="grid size-7 place-items-center rounded-md bg-white/[0.07] font-mono text-sm font-black tabular-nums text-[var(--future-ink)]">
          {index + 1}
        </div>
      )}
      <div className="min-w-0">
        {!isHot && (
          <time className="mb-1 block font-mono text-[11px] font-semibold tabular-nums leading-none text-[var(--future-muted)]">
            {timeText}
          </time>
        )}
        <Link
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-semibold leading-5 transition-colors group-hover:text-[var(--future-accent)]"
        >
          {item.title}
          <NewsItemBadges item={item} />
        </Link>
        {itemSummary && (
          <p className="future-muted mt-1 line-clamp-1 text-xs">
            {itemSummary}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 rounded-full"
              onClick={onToggleSaved}
              aria-label={saved ? "取消收藏" : "收藏"}
            >
              {saved ? (
                <BookmarkCheck className="size-4 text-[var(--future-accent)]" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{saved ? "取消收藏" : "收藏"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="size-7 rounded-full"
            >
              <Link
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`打开 ${source.name} 新闻`}
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>打开</TooltipContent>
        </Tooltip>
      </div>
    </article>
  );
};

const NewsLoadingShell = () => (
  <div className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-8 sm:px-8 lg:px-12">
    <div className="mb-5 border-b border-[var(--future-line)] pb-5">
      <Skeleton className="h-9 w-48 bg-white/10" />
      <Skeleton className="mt-4 h-12 max-w-2xl bg-white/10" />
      <Skeleton className="mt-3 h-5 max-w-xl bg-white/10" />
    </div>
    <NewsSkeletonGrid />
  </div>
);

const NewsGuestGate = () => (
  <div className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-8 sm:px-8 lg:px-12">
    <section className="relative mb-5 overflow-hidden rounded-lg border border-[var(--future-line)] bg-[var(--future-panel-strong)] p-6 shadow-[var(--future-shadow)] backdrop-blur-2xl md:p-8">
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_16%_12%,var(--future-accent-soft),transparent_24rem),radial-gradient(circle_at_84%_18%,var(--future-cyan-soft),transparent_22rem)]" />
      <div className="relative z-[1] max-w-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.05] text-[var(--future-accent)]">
            <LockKeyhole className="size-4" />
          </span>
          <span className="future-label">Private News Desk</span>
        </div>
        <h1 className="future-heading text-3xl font-black leading-tight md:text-5xl">
          登录后查看你的新闻源
        </h1>
        <p className="future-muted mt-4 text-sm leading-6 md:text-base">
          未登录状态不会显示新闻内容。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/sign_in"
            className={cn(
              buttonVariants(),
              "h-10 rounded-full bg-[var(--future-accent)] px-5 text-white hover:bg-[var(--future-accent)]/90",
            )}
          >
            登录
          </Link>
          <Link
            href="/auth/sign_up"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-full border-[var(--future-line)] bg-white/[0.04] px-5 text-[var(--future-ink)]",
            )}
          >
            注册
          </Link>
        </div>
      </div>
    </section>

    <div className="pointer-events-none select-none opacity-70 blur-[1px]">
      <NewsSkeletonGrid />
    </div>
  </div>
);

const NewsSkeletonGrid = () => (
  <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <Card key={index} className="h-[430px] overflow-hidden rounded-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="size-9 rounded-full bg-white/10" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-24 bg-white/10" />
            <Skeleton className="mt-2 h-3 w-32 bg-white/10" />
          </div>
          <Skeleton className="size-7 rounded-full bg-white/10" />
        </div>
        <div className="mt-3 grid gap-4 rounded-lg border border-[var(--future-line)] bg-black/[0.08] p-3">
          {Array.from({ length: 7 }).map((__, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[2rem_1fr] gap-3">
              <Skeleton className="h-4 w-6 bg-white/10" />
              <div>
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="mt-2 h-3 w-3/5 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

const NewsRowsSkeleton = ({ type }: { type: NewsSource["type"] }) => (
  <div className="grid gap-0">
    {Array.from({ length: NEWS_PREVIEW_LIMIT }).map((_, index) => (
      <div
        key={index}
        className={cn(
          "grid gap-3 p-3",
          type === "hottest" ? "grid-cols-[2rem_1fr]" : "grid-cols-[1fr]",
        )}
      >
        {type === "hottest" && <Skeleton className="size-7 bg-white/10" />}
        <div>
          {type !== "hottest" && (
            <Skeleton className="mb-2 h-3 w-16 bg-white/10" />
          )}
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="mt-2 h-3 w-3/5 bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyFollowedSources = ({
  onBrowseHottest,
}: {
  onBrowseHottest: () => void;
}) => (
  <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-[var(--future-line)] bg-white/[0.03] p-8 text-center">
    <div>
      <div className="mx-auto grid size-14 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.05]">
        <Star className="size-5 text-[var(--future-accent)]" />
      </div>
      <p className="mt-4 text-lg font-semibold">还没有关注新闻源</p>
      <p className="future-muted mt-2 max-w-sm text-sm leading-6">
        在最热或实时里点击卡片星标，关注后会出现在这里。
      </p>
      <Button
        className="mt-5 rounded-full bg-[var(--future-accent)] text-white hover:opacity-90"
        onClick={onBrowseHottest}
      >
        去看最热
      </Button>
    </div>
  </div>
);

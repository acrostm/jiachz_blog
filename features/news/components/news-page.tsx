"use client";

import React from "react";

import Link from "next/link";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Globe2,
  Loader2,
  Newspaper,
  RefreshCcw,
  Rss,
  Settings2,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import type {
  NewsColumn,
  NewsColumnId,
  NewsItem,
  NewsItemsResponse,
  NewsPreference,
  NewsSource,
  SavedNewsItem,
} from "../types";

gsap.registerPlugin(useGSAP);

type NewsPageProps = {
  columns: NewsColumn[];
  sources: NewsSource[];
};

const sourceTone: Record<NewsSource["color"], string> = {
  blue: "border-blue-400/30 bg-blue-400/10 text-blue-600 dark:text-blue-200",
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
  gray: "border-zinc-400/30 bg-zinc-400/10 text-zinc-700 dark:text-zinc-200",
  green:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  orange:
    "border-orange-400/30 bg-orange-400/10 text-orange-700 dark:text-orange-200",
  red: "border-red-400/30 bg-red-400/10 text-red-700 dark:text-red-200",
  slate:
    "border-slate-400/30 bg-slate-400/10 text-slate-700 dark:text-slate-200",
};

const columnIcons: Record<
  NewsColumnId,
  React.ComponentType<{ className?: string }>
> = {
  china: Flame,
  finance: Zap,
  tech: Compass,
  world: Globe2,
};

const formatRelativeTime = (value?: number | string | null) => {
  if (!value) return "尚未更新";

  const timestamp =
    typeof value === "number"
      ? value
      : Number.isNaN(Number(value))
        ? Date.parse(value)
        : Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) return "尚未更新";

  const diff = Date.now() - timestamp;
  const minute = Math.floor(diff / 60_000);
  if (minute < 1) return "刚刚";
  if (minute < 60) return `${minute} 分钟前`;
  const hour = Math.floor(minute / 60);
  if (hour < 24) return `${hour} 小时前`;
  return `${Math.floor(hour / 24)} 天前`;
};

const getItemKey = (sourceId: string, itemId: string | number) =>
  `${sourceId}:${String(itemId)}`;

const createDefaultPreference = (sources: NewsSource[]): NewsPreference => ({
  sourceOrder: sources.map((source) => source.id),
  hiddenSources: [],
  defaultColumn: "china",
});

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

export const NewsPage = ({ columns, sources }: NewsPageProps) => {
  const scope = React.useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const defaultPreference = React.useMemo(
    () => createDefaultPreference(sources),
    [sources],
  );
  const [preference, setPreference] =
    React.useState<NewsPreference>(defaultPreference);
  const [draftPreference, setDraftPreference] =
    React.useState<NewsPreference>(defaultPreference);
  const [activeColumn, setActiveColumn] = React.useState<NewsColumnId>("china");
  const [activeSourceId, setActiveSourceId] = React.useState(
    sources.find((source) => source.column === "china")?.id ?? sources[0]?.id,
  );
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [savedItems, setSavedItems] = React.useState<SavedNewsItem[]>([]);
  const [responseMeta, setResponseMeta] =
    React.useState<
      Pick<NewsItemsResponse, "status" | "updatedTime" | "error">
    >();
  const [isFetching, setIsFetching] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSavingPreference, setIsSavingPreference] = React.useState(false);

  const orderedSources = React.useMemo(
    () => sortSources(sources, preference.sourceOrder),
    [preference.sourceOrder, sources],
  );
  const visibleSources = React.useMemo(
    () =>
      orderedSources.filter(
        (source) => !preference.hiddenSources.includes(source.id),
      ),
    [orderedSources, preference.hiddenSources],
  );
  const activeSource = sources.find((source) => source.id === activeSourceId);
  const currentColumnSources = visibleSources.filter(
    (source) => source.column === activeColumn,
  );
  const savedKeys = React.useMemo(
    () =>
      new Set(savedItems.map((item) => getItemKey(item.sourceId, item.itemId))),
    [savedItems],
  );

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
        { autoAlpha: 0, y: 26, filter: "blur(14px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.82,
          ease: "power3.out",
          stagger: 0.06,
        },
      );
    },
    { scope },
  );

  const chooseColumn = React.useCallback(
    (columnId: NewsColumnId, nextSources = visibleSources) => {
      setActiveColumn(columnId);
      const nextSource =
        nextSources.find((source) => source.column === columnId) ??
        nextSources[0] ??
        sources[0];

      if (nextSource) {
        setActiveSourceId(nextSource.id);
      }
    },
    [sources, visibleSources],
  );

  const fetchSavedItems = React.useCallback(async () => {
    if (!isAuthenticated) {
      setSavedItems([]);
      return;
    }

    const response = await fetch("/api/news/me/saved");
    if (!response.ok) return;

    const data = (await response.json()) as { items: SavedNewsItem[] };
    setSavedItems(data.items);
  }, [isAuthenticated]);

  const fetchPreference = React.useCallback(async () => {
    if (!isAuthenticated) {
      setPreference(defaultPreference);
      setDraftPreference(defaultPreference);
      return;
    }

    const response = await fetch("/api/news/me/preferences");
    if (!response.ok) return;

    const data = (await response.json()) as NewsPreference;
    setPreference(data);
    setDraftPreference(data);

    const nextSources = sortSources(sources, data.sourceOrder).filter(
      (source) => !data.hiddenSources.includes(source.id),
    );
    chooseColumn(data.defaultColumn ?? "china", nextSources);
  }, [chooseColumn, defaultPreference, isAuthenticated, sources]);

  const fetchItems = React.useCallback(
    async (sourceId: string, latest = false) => {
      if (!sourceId) return;

      setIsFetching(true);
      setIsRefreshing(latest);

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

        setItems(data.items);
        setResponseMeta({
          status: data.status,
          updatedTime: data.updatedTime,
          error: data.error,
        });

        if (latest && data.status === "rate_limited") {
          toast.info("刷新太频繁，已返回最近缓存");
        } else if (latest && data.status === "success") {
          toast.success("新闻源已刷新");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "加载失败");
      } finally {
        setIsFetching(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (authLoading) return;
    void fetchPreference();
    void fetchSavedItems();
  }, [authLoading, fetchPreference, fetchSavedItems]);

  React.useEffect(() => {
    if (!activeSourceId) return;
    void fetchItems(activeSourceId);
  }, [activeSourceId, fetchItems]);

  React.useEffect(() => {
    if (!currentColumnSources.length) return;
    if (!currentColumnSources.some((source) => source.id === activeSourceId)) {
      const nextSource = currentColumnSources[0];
      if (nextSource) {
        setActiveSourceId(nextSource.id);
      }
    }
  }, [activeSourceId, currentColumnSources]);

  const moveDraftSource = (sourceId: string, direction: "up" | "down") => {
    setDraftPreference((current) => {
      const order = [
        ...current.sourceOrder,
        ...sources
          .map((source) => source.id)
          .filter((id) => !current.sourceOrder.includes(id)),
      ];
      const index = order.indexOf(sourceId);
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) {
        return current;
      }

      const nextOrder = [...order];
      const [source] = nextOrder.splice(index, 1);
      if (!source) return current;
      nextOrder.splice(nextIndex, 0, source);

      return {
        ...current,
        sourceOrder: nextOrder,
      };
    });
  };

  const toggleDraftSource = (sourceId: string, visible: boolean) => {
    setDraftPreference((current) => ({
      ...current,
      hiddenSources: visible
        ? current.hiddenSources.filter((id) => id !== sourceId)
        : Array.from(new Set([...current.hiddenSources, sourceId])),
    }));
  };

  const savePreference = async () => {
    setIsSavingPreference(true);

    try {
      const response = await fetch("/api/news/me/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftPreference),
      });

      if (!response.ok) {
        throw new Error("保存偏好失败");
      }

      const data = (await response.json()) as NewsPreference;
      setPreference(data);
      setDraftPreference(data);

      const nextSources = sortSources(sources, data.sourceOrder).filter(
        (source) => !data.hiddenSources.includes(source.id),
      );
      chooseColumn(data.defaultColumn ?? activeColumn, nextSources);
      toast.success("新闻偏好已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存偏好失败");
    } finally {
      setIsSavingPreference(false);
    }
  };

  const toggleSaved = async (item: NewsItem) => {
    if (!isAuthenticated || !activeSource) {
      toast.info("登录后可收藏新闻");
      return;
    }

    const key = getItemKey(activeSource.id, item.id);

    if (savedKeys.has(key)) {
      const params = new URLSearchParams({
        sourceId: activeSource.id,
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
          (saved) =>
            getItemKey(saved.sourceId, saved.itemId) !==
            getItemKey(activeSource.id, item.id),
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
        sourceId: activeSource.id,
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

  const statusText =
    responseMeta?.status === "success"
      ? "Live"
      : responseMeta?.status === "rate_limited"
        ? "Limited"
        : responseMeta?.status === "empty"
          ? "Empty"
          : "Cache";

  return (
    <div
      ref={scope}
      className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-8 sm:px-8 lg:px-12"
    >
      <section
        data-news-reveal
        className="relative overflow-hidden rounded-[2rem] border border-[var(--future-line)] bg-[var(--future-panel-strong)] p-6 shadow-[var(--future-shadow)] backdrop-blur-2xl md:p-8"
      >
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_12%_10%,var(--future-accent-soft),transparent_28rem),radial-gradient(circle_at_88%_12%,var(--future-cyan-soft),transparent_26rem),linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]" />
        <div className="relative z-[1] grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-accent)] shadow-inner">
                <Rss className="size-5" />
              </span>
              <span className="future-label">NewsNow / Jiach Signal Desk</span>
            </div>
            <h1 className="future-heading max-w-4xl text-5xl font-black leading-[0.94] md:text-7xl">
              把热榜变成可收藏的信息流
            </h1>
            <p className="future-muted mt-6 max-w-3xl text-base leading-7 md:text-lg">
              聚合中文热搜、技术社区、开源趋势与商业快讯，使用本站账号同步收藏和阅读偏好。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                className="h-11 rounded-full bg-[var(--future-accent)] px-5 text-white hover:opacity-90"
                onClick={() =>
                  activeSourceId && fetchItems(activeSourceId, true)
                }
                disabled={isFetching || !activeSourceId}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 size-4" />
                )}
                刷新当前源
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-[var(--future-line)] bg-white/[0.04] px-5 text-[var(--future-ink)]"
                    disabled={!isAuthenticated}
                    onClick={() => setDraftPreference(preference)}
                  >
                    <Settings2 className="mr-2 size-4" />
                    偏好
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full overflow-y-auto border-[var(--future-line)] text-[var(--future-ink)] sm:max-w-xl">
                  <SheetHeader>
                    <SheetTitle className="text-2xl">新闻偏好</SheetTitle>
                    <SheetDescription className="future-muted">
                      调整默认分类、源排序和可见状态。
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-8 grid gap-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">默认分类</label>
                      <Select
                        value={draftPreference.defaultColumn ?? "china"}
                        onValueChange={(value) =>
                          setDraftPreference((current) => ({
                            ...current,
                            defaultColumn: value as NewsColumnId,
                          }))
                        }
                      >
                        <SelectTrigger className="future-control-glass rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              {column.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3">
                      {sortSources(sources, draftPreference.sourceOrder).map(
                        (source, index) => {
                          const visible =
                            !draftPreference.hiddenSources.includes(source.id);

                          return (
                            <div
                              key={source.id}
                              className="future-card flex items-center gap-3 rounded-2xl p-3"
                            >
                              <span
                                className={cn(
                                  "grid size-9 place-items-center rounded-full border text-xs font-bold",
                                  sourceTone[source.color],
                                )}
                              >
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">
                                  {source.name}
                                </p>
                                <p className="future-muted truncate text-xs">
                                  {source.title ?? source.home}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 rounded-full"
                                      onClick={() =>
                                        moveDraftSource(source.id, "up")
                                      }
                                      disabled={index === 0}
                                    >
                                      <ArrowUp className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>上移</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 rounded-full"
                                      onClick={() =>
                                        moveDraftSource(source.id, "down")
                                      }
                                      disabled={index === sources.length - 1}
                                    >
                                      <ArrowDown className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>下移</TooltipContent>
                                </Tooltip>
                                <Switch
                                  checked={visible}
                                  onCheckedChange={(checked) =>
                                    toggleDraftSource(source.id, checked)
                                  }
                                  aria-label={`${source.name} 可见状态`}
                                />
                                {visible ? (
                                  <Eye className="size-4 text-[var(--future-muted)]" />
                                ) : (
                                  <EyeOff className="size-4 text-[var(--future-muted)]" />
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>

                    <Button
                      className="h-11 rounded-full bg-[var(--future-accent)] text-white hover:opacity-90"
                      onClick={savePreference}
                      disabled={isSavingPreference}
                    >
                      {isSavingPreference && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      保存偏好
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              {!isAuthenticated && !authLoading && (
                <Link
                  href="/auth/sign_in"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 rounded-full border-[var(--future-line)] bg-white/[0.04] px-5 text-[var(--future-ink)]",
                  )}
                >
                  登录同步
                </Link>
              )}
            </div>
          </div>

          <div className="future-panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <span className="future-label">Signal</span>
              <Badge className="rounded-full bg-[var(--future-accent-soft)] text-[var(--future-accent)] hover:bg-[var(--future-accent-soft)]">
                {statusText}
              </Badge>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <MetricTile
                icon={Newspaper}
                label="当前源"
                value={activeSource?.name ?? "-"}
              />
              <MetricTile
                icon={Star}
                label="收藏"
                value={`${savedItems.length}`}
              />
              <MetricTile
                icon={Clock3}
                label="更新"
                value={formatRelativeTime(responseMeta?.updatedTime)}
              />
              <MetricTile
                icon={Sparkles}
                label="模式"
                value={isAuthenticated ? "Sync" : "Read"}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside
          data-news-reveal
          className="grid gap-4 self-start lg:sticky lg:top-24"
        >
          <div className="future-card rounded-3xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">分类</p>
              <span className="future-label">
                {visibleSources.length} feeds
              </span>
            </div>
            <div className="grid gap-2">
              {columns.map((column) => {
                const Icon = columnIcons[column.id];
                const count = visibleSources.filter(
                  (source) => source.column === column.id,
                ).length;

                return (
                  <button
                    key={column.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-all",
                      activeColumn === column.id
                        ? "border-[var(--future-line)] bg-white/[0.12] text-[var(--future-ink)] shadow-inner"
                        : "text-[var(--future-muted)] hover:bg-white/[0.08] hover:text-[var(--future-ink)]",
                    )}
                    onClick={() => chooseColumn(column.id)}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.05]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{column.name}</span>
                      <span className="future-muted block truncate text-xs">
                        {column.description}
                      </span>
                    </span>
                    <span className="font-mono text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="future-card rounded-3xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">源</p>
              <span className="future-label">{activeColumn}</span>
            </div>
            <div className="grid gap-2">
              {currentColumnSources.map((source) => (
                <button
                  key={source.id}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-all",
                    activeSourceId === source.id
                      ? "border-[var(--future-accent)] bg-[var(--future-accent-soft)]"
                      : "border-[var(--future-line)] bg-white/[0.03] hover:bg-white/[0.08]",
                  )}
                  onClick={() => setActiveSourceId(source.id)}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{source.name}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold",
                        sourceTone[source.color],
                      )}
                    >
                      {source.type}
                    </span>
                  </span>
                  <span className="future-muted mt-1 block truncate text-xs">
                    {source.title ?? source.home}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main data-news-reveal className="min-w-0">
          <div className="future-card overflow-hidden rounded-[1.6rem]">
            <div className="flex flex-col gap-4 border-b border-[var(--future-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="future-label">Feed</p>
                <h2 className="mt-2 text-2xl font-bold">
                  {activeSource?.name ?? "News"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="future-muted text-sm">
                  {formatRelativeTime(responseMeta?.updatedTime)}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    activeSourceId && fetchItems(activeSourceId, true)
                  }
                  disabled={isFetching || !activeSourceId}
                >
                  {isRefreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {responseMeta?.error && (
              <div className="border-b border-[var(--future-line)] bg-[var(--future-accent-soft)] px-5 py-3 text-sm text-[var(--future-ink)]">
                {responseMeta.error}
              </div>
            )}

            <div className="divide-y divide-[var(--future-line)]">
              {isFetching && !items.length ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-pulse p-5">
                    <div className="h-4 w-2/3 rounded-full bg-white/20" />
                    <div className="mt-3 h-3 w-1/2 rounded-full bg-white/10" />
                  </div>
                ))
              ) : items.length ? (
                items.map((item, index) => (
                  <NewsRow
                    key={`${activeSourceId}-${item.id}`}
                    index={index}
                    item={item}
                    source={activeSource}
                    saved={
                      !!activeSource &&
                      savedKeys.has(getItemKey(activeSource.id, item.id))
                    }
                    onToggleSaved={() => toggleSaved(item)}
                  />
                ))
              ) : (
                <div className="grid min-h-[360px] place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid size-14 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06]">
                      <Rss className="size-6 text-[var(--future-accent)]" />
                    </div>
                    <p className="mt-4 text-lg font-semibold">
                      当前没有缓存内容
                    </p>
                    <p className="future-muted mt-2 max-w-sm text-sm leading-6">
                      {isAuthenticated
                        ? "点击刷新当前源获取最新内容。"
                        : "登录后可刷新新闻源并同步收藏。"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <aside
          data-news-reveal
          className="grid gap-4 self-start lg:sticky lg:top-24"
        >
          <div className="future-card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">稍后读</p>
              <BookmarkCheck className="size-4 text-[var(--future-accent)]" />
            </div>
            <div className="mt-4 grid gap-3">
              {savedItems.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-[var(--future-line)] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.08]"
                >
                  <span className="future-muted block text-xs">
                    {sources.find((source) => source.id === item.sourceId)
                      ?.name ?? item.sourceId}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm font-semibold leading-6 group-hover:text-[var(--future-accent)]">
                    {item.title}
                  </span>
                </Link>
              ))}
              {!savedItems.length && (
                <p className="future-muted rounded-2xl border border-dashed border-[var(--future-line)] p-4 text-sm leading-6">
                  暂无收藏。
                </p>
              )}
            </div>
          </div>

          <div className="future-panel rounded-3xl p-5">
            <p className="future-label">Source Home</p>
            <p className="mt-3 text-lg font-semibold">
              {activeSource?.name ?? "News"}
            </p>
            {activeSource && (
              <Link
                href={activeSource.home}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--future-line)] bg-white/[0.06] px-4 py-2 text-sm font-medium hover:bg-white/[0.1]"
              >
                打开源站
                <ArrowUpRight className="size-4" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const MetricTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-4">
    <Icon className="size-4 text-[var(--future-accent)]" />
    <p className="future-muted mt-4 text-xs">{label}</p>
    <p className="mt-1 truncate font-semibold">{value}</p>
  </div>
);

const NewsRow = ({
  index,
  item,
  source,
  saved,
  onToggleSaved,
}: {
  index: number;
  item: NewsItem;
  source?: NewsSource;
  saved: boolean;
  onToggleSaved: () => void;
}) => (
  <article className="group grid gap-4 p-5 transition-colors hover:bg-white/[0.06] sm:grid-cols-[44px_minmax(0,1fr)_auto]">
    <div className="grid size-11 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.04] font-mono text-sm font-bold text-[var(--future-accent)]">
      {String(index + 1).padStart(2, "0")}
    </div>
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {source && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold",
              sourceTone[source.color],
            )}
          >
            {source.name}
          </span>
        )}
        {item.extra?.info && (
          <span className="future-muted rounded-full border border-[var(--future-line)] px-2.5 py-1 text-[0.68rem]">
            {item.extra.info}
          </span>
        )}
      </div>
      <Link
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="line-clamp-2 text-xl font-bold leading-8 transition-colors group-hover:text-[var(--future-accent)]"
      >
        {item.title}
      </Link>
      {item.extra?.hover && (
        <p className="future-muted mt-2 line-clamp-2 text-sm leading-6">
          {item.extra.hover}
        </p>
      )}
    </div>
    <div className="flex items-start gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={onToggleSaved}
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
      <Button asChild size="icon" variant="outline" className="rounded-full">
        <Link href={item.url} target="_blank" rel="noreferrer">
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </div>
  </article>
);

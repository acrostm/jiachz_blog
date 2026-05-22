"use client";

import React from "react";

import Link from "next/link";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgePercent,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flame,
  Gamepad2,
  Gift,
  Loader2,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

import type {
  SteamDealItem,
  SteamDealsResponse,
  SteamPriceStatus,
  SteamPricesResponse,
  SteamRegionPrice,
  SteamSearchResult,
} from "../types";

gsap.registerPlugin(useGSAP);

type SearchStatus = "error" | "idle" | "loading" | "success";
type PriceStatus = "error" | "idle" | "loading" | "success";
type DealsStatus = "error" | "idle" | "loading" | "success";

type SteamSearchResponse = {
  items: SteamSearchResult[];
  message?: string;
};

type SteamDealsApiResponse = SteamDealsResponse | { message?: string };

const examples = ["Forza Horizon 5", "Cyberpunk 2077", "Baldur's Gate 3"];
const dealLimitOptions = [10, 20, 30, 50, 100] as const;

type DealLimit = (typeof dealLimitOptions)[number];

const isDealLimit = (value: number): value is DealLimit =>
  dealLimitOptions.includes(value as DealLimit);

const statusTone: Record<SteamPriceStatus, string> = {
  available:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  error: "border-red-400/30 bg-red-400/10 text-red-700 dark:text-red-200",
  exchange_missing:
    "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200",
  free: "border-cyan-400/30 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
  no_price:
    "border-zinc-400/30 bg-zinc-400/10 text-zinc-700 dark:text-zinc-200",
  unavailable:
    "border-slate-400/30 bg-slate-400/10 text-slate-700 dark:text-slate-200",
};

const parseInputAppId = (value: string) => {
  const text = value.trim();
  const urlMatch = /store\.steampowered\.com\/app\/(\d{2,10})/i.exec(text);

  if (urlMatch?.[1]) return Number(urlMatch[1]);
  if (/^\d{2,10}$/.test(text)) return Number(text);

  return null;
};

const shouldSearch = (value: string) => {
  const text = value.trim();

  return text.length >= 2 || parseInputAppId(text) !== null;
};

const getQueryTime = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));

const getRankLabel = (rank: number | null) => (rank ? `#${rank}` : "--");

const getVsTone = (value: number | null, id: string) => {
  if (id === "cn") return "text-[var(--future-accent)]";
  if (value === null || Math.abs(value) < 0.5)
    return "text-[var(--future-muted)]";
  return value < 0
    ? "text-emerald-700 dark:text-emerald-200"
    : "text-red-700 dark:text-red-200";
};

const getStatusIcon = (status: SteamPriceStatus) => {
  if (status === "available" || status === "free") {
    return CheckCircle2;
  }
  if (status === "error") return XCircle;
  return AlertTriangle;
};

const getDealTime = (value: string | null) => {
  if (!value) return "以 Steam 页面为准";

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getPlatformLabel = (deal: SteamDealItem) => {
  const platforms = [
    deal.platforms.windows ? "Windows" : null,
    deal.platforms.mac ? "macOS" : null,
    deal.platforms.linux ? "Linux" : null,
  ].filter(Boolean);

  return platforms.length ? platforms.join(" / ") : "平台信息以 Steam 为准";
};

export function SteamPricesPage() {
  const scope = React.useRef<HTMLDivElement>(null);
  const priceRequestId = React.useRef(0);
  const dealsRequestId = React.useRef(0);
  const suppressedSearchQuery = React.useRef<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<SteamSearchResult[]>([]);
  const [searchStatus, setSearchStatus] = React.useState<SearchStatus>("idle");
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [selectedGame, setSelectedGame] =
    React.useState<SteamSearchResult | null>(null);
  const [prices, setPrices] = React.useState<SteamPricesResponse | null>(null);
  const [priceStatus, setPriceStatus] = React.useState<PriceStatus>("idle");
  const [priceError, setPriceError] = React.useState<string | null>(null);
  const [deals, setDeals] = React.useState<SteamDealsResponse | null>(null);
  const [dealsStatus, setDealsStatus] = React.useState<DealsStatus>("idle");
  const [dealsError, setDealsError] = React.useState<string | null>(null);
  const [dealLimit, setDealLimit] = React.useState<DealLimit>(10);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set("[data-steam-reveal]", { autoAlpha: 1 });
        return;
      }

      gsap.fromTo(
        "[data-steam-reveal]",
        { autoAlpha: 0, y: 26, filter: "blur(10px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.78,
          ease: "power3.out",
          stagger: 0.08,
        },
      );
    },
    { scope },
  );

  useGSAP(
    () => {
      if (!prices) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set("[data-price-row]", { autoAlpha: 1 });
        return;
      }

      gsap.fromTo(
        "[data-price-row]",
        { autoAlpha: 0, x: -18 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.42,
          ease: "power2.out",
          stagger: 0.035,
        },
      );
    },
    { dependencies: [prices?.queriedAt], scope },
  );

  useGSAP(
    () => {
      if (!deals) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set("[data-deal-card]", { autoAlpha: 1 });
        return;
      }

      const animation = gsap.fromTo(
        "[data-deal-card]",
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.36,
          ease: "power2.out",
          onComplete: () => {
            gsap.set("[data-deal-card]", {
              clearProps: "opacity,transform,visibility",
            });
          },
          stagger: 0.025,
        },
      );
      const fallback = window.setTimeout(() => {
        animation.progress(1);
      }, 900);

      return () => window.clearTimeout(fallback);
    },
    { dependencies: [deals?.queriedAt, deals?.discounts.length], scope },
  );

  React.useEffect(() => {
    const text = query.trim();
    setSearchError(null);

    if (suppressedSearchQuery.current === text) {
      setSearchStatus("idle");
      setSuggestions([]);
      return;
    }

    if (!shouldSearch(text)) {
      setSearchStatus("idle");
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void (async () => {
        setSearchStatus("loading");

        try {
          const response = await fetch(
            `/api/steam/search?q=${encodeURIComponent(text)}`,
            { signal: controller.signal },
          );
          const payload = (await response.json()) as SteamSearchResponse;

          if (!response.ok) {
            throw new Error(payload.message ?? "Steam 搜索失败");
          }

          if (suppressedSearchQuery.current === text) {
            setSuggestions([]);
            setSearchStatus("idle");
            return;
          }

          setSuggestions(payload.items);
          setSearchStatus("success");
        } catch (error) {
          if (controller.signal.aborted) return;

          setSuggestions([]);
          setSearchStatus("error");
          setSearchError(
            error instanceof Error ? error.message : "Steam 搜索失败",
          );
        }
      })();
    }, 320);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const loadDeals = React.useCallback(async () => {
    const requestId = dealsRequestId.current + 1;
    dealsRequestId.current = requestId;
    setDealsStatus("loading");
    setDealsError(null);

    try {
      const response = await fetch(`/api/steam/deals?limit=${dealLimit}`);
      const payload = (await response.json()) as SteamDealsApiResponse;

      if (!response.ok) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Steam 优惠加载失败",
        );
      }

      if (requestId !== dealsRequestId.current) return;

      setDeals(payload as SteamDealsResponse);
      setDealsStatus("success");
    } catch (error) {
      if (requestId !== dealsRequestId.current) return;

      setDealsStatus("error");
      setDealsError(
        error instanceof Error ? error.message : "Steam 优惠加载失败",
      );
    }
  }, [dealLimit]);

  React.useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const loadPrices = React.useCallback(async (appid: number) => {
    const requestId = priceRequestId.current + 1;
    priceRequestId.current = requestId;
    setPriceStatus("loading");
    setPriceError(null);

    try {
      const response = await fetch(`/api/steam/prices?appid=${appid}`);
      const payload = (await response.json()) as
        | SteamPricesResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Steam 比价失败",
        );
      }

      if (requestId !== priceRequestId.current) return;

      setPrices(payload as SteamPricesResponse);
      setPriceStatus("success");
    } catch (error) {
      if (requestId !== priceRequestId.current) return;

      setPriceStatus("error");
      setPriceError(error instanceof Error ? error.message : "Steam 比价失败");
    }
  }, []);

  const handleSelectGame = React.useCallback(
    (game: SteamSearchResult) => {
      suppressedSearchQuery.current = game.name;
      setSelectedGame(game);
      setQuery(game.name);
      setSuggestions([]);
      setSearchStatus("idle");
      void loadPrices(game.appid);
    },
    [loadPrices],
  );

  const handleSubmit = React.useCallback(() => {
    const firstSuggestion = suggestions[0];

    if (firstSuggestion) {
      handleSelectGame(firstSuggestion);
      return;
    }

    const appid = parseInputAppId(query);

    if (appid) {
      suppressedSearchQuery.current = query.trim();
      setSelectedGame({
        appid,
        image: null,
        name: `Steam App ${appid}`,
        platforms: {
          linux: false,
          mac: false,
          windows: false,
        },
        price: null,
        type: "app",
      });
      setSuggestions([]);
      setSearchStatus("idle");
      void loadPrices(appid);
    }
  }, [handleSelectGame, loadPrices, query, suggestions]);

  const resultImage = prices?.image ?? selectedGame?.image ?? null;
  const hasSuggestions = suggestions.length > 0;
  const isLoadingPrices = priceStatus === "loading";
  const availableRows = React.useMemo(
    () => prices?.regions.filter((region) => region.cnyPrice !== null) ?? [],
    [prices],
  );

  return (
    <div ref={scope} className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <section
          data-steam-reveal
          className="relative overflow-hidden rounded-[2rem] border border-[var(--future-line)] bg-[var(--future-panel-strong)] p-6 shadow-[var(--future-shadow)] backdrop-blur-2xl md:p-9"
        >
          <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_14%_14%,var(--future-accent-soft),transparent_28rem),radial-gradient(circle_at_88%_20%,var(--future-cyan-soft),transparent_26rem),radial-gradient(circle_at_72%_92%,var(--future-gold-soft),transparent_22rem)]" />
          <div className="relative z-[1]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-accent)]">
                  <Gamepad2 className="size-5" />
                </span>
                <span className="future-label">Steam Prices</span>
              </div>

              <h1 className="future-heading max-w-4xl text-[2.65rem] font-black leading-[1.02] sm:text-5xl sm:leading-[0.95] md:text-7xl">
                Steam 多区官方价实时比价
              </h1>
              <p className="future-muted mt-6 max-w-2xl text-base leading-8 md:text-lg">
                输入游戏名、AppID 或 Steam 商店链接，查询固定区域的 Steam
                官方价格，并按人民币折算结果排序。
              </p>
            </div>
          </div>
        </section>

        <section data-steam-reveal className="relative z-0 mt-6">
          <SteamDealsPanel
            deals={deals}
            error={dealsError}
            limit={dealLimit}
            onLimitChange={setDealLimit}
            onRefresh={loadDeals}
            status={dealsStatus}
          />
        </section>

        <section data-steam-reveal className="relative z-30 mt-6">
          <div className="future-panel-strong relative z-20 rounded-3xl p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--future-muted)]" />
                <Input
                  value={query}
                  onChange={(event) => {
                    suppressedSearchQuery.current = null;
                    setQuery(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="输入游戏名、Steam AppID 或商店链接"
                  className="h-12 rounded-full pl-11 pr-4 text-base"
                  aria-label="搜索 Steam 游戏"
                />
              </div>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoadingPrices || !shouldSearch(query)}
                className="h-12 rounded-full bg-[var(--future-accent)] px-6 text-white hover:opacity-90"
              >
                {isLoadingPrices ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Search className="mr-2 size-4" />
                )}
                生成比价
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {examples.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    suppressedSearchQuery.current = null;
                    setQuery(example);
                  }}
                  className="rounded-full border-[var(--future-line)] bg-white/[0.04] text-[var(--future-muted)] hover:text-[var(--future-ink)]"
                >
                  {example}
                </Button>
              ))}
            </div>

            {(hasSuggestions ||
              searchStatus === "loading" ||
              searchStatus === "error" ||
              (searchStatus === "success" && shouldSearch(query))) && (
              <div className="absolute inset-x-4 top-[5.25rem] z-50 rounded-2xl border border-[var(--future-line)] bg-[var(--future-bg)] p-2 shadow-[var(--future-shadow)] md:inset-x-5">
                {searchStatus === "loading" && (
                  <div className="grid gap-2 p-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Skeleton className="h-12 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-2/3 rounded-full" />
                          <Skeleton className="h-3 w-1/3 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchStatus === "error" && (
                  <p className="future-muted p-4 text-sm">
                    {searchError ?? "Steam 搜索失败"}
                  </p>
                )}

                {searchStatus === "success" && !hasSuggestions && (
                  <p className="future-muted p-4 text-sm">
                    没有找到匹配游戏，试试英文名、AppID 或完整 Steam 链接。
                  </p>
                )}

                {hasSuggestions && (
                  <div className="grid max-h-96 gap-1 overflow-y-auto">
                    {suggestions.map((game) => (
                      <button
                        key={game.appid}
                        type="button"
                        onClick={() => handleSelectGame(game)}
                        className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.08]"
                      >
                        <GameImage
                          image={game.image}
                          name={game.name}
                          className="h-12 w-24 rounded-lg"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--future-ink)] group-hover:text-[var(--future-accent)]">
                            {game.name}
                          </span>
                          <span className="future-muted mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
                            <span>AppID {game.appid}</span>
                            {game.price && <span>{game.price}</span>}
                          </span>
                        </span>
                        <ArrowUpRight className="size-4 text-[var(--future-muted)] group-hover:text-[var(--future-accent)]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section data-steam-reveal className="relative z-0 mt-6">
          {renderResult()}
        </section>
      </div>
    </div>
  );

  function renderResult() {
    if (priceStatus === "idle" && !prices) {
      return (
        <div className="grid min-h-[360px] place-items-center rounded-3xl border border-dashed border-[var(--future-line)] bg-white/[0.03] p-8 text-center">
          <div>
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.05]">
              <Gamepad2 className="size-6 text-[var(--future-accent)]" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-[var(--future-ink)]">
              选择一个 Steam 游戏开始比价
            </h2>
            <p className="future-muted mx-auto mt-3 max-w-lg text-sm leading-6">
              页面会生成国区基准价、全区人民币折算排行和价格状态。
            </p>
          </div>
        </div>
      );
    }

    if (priceStatus === "loading" && !prices) {
      return <PriceSkeleton />;
    }

    if (priceStatus === "error" && !prices) {
      return (
        <div className="future-panel-strong rounded-3xl p-8 text-center">
          <XCircle className="mx-auto size-10 text-red-500" />
          <h2 className="mt-4 text-2xl font-black text-[var(--future-ink)]">
            比价失败
          </h2>
          <p className="future-muted mt-3 text-sm">
            {priceError ?? "Steam 比价失败，请稍后再试。"}
          </p>
        </div>
      );
    }

    if (!prices) return null;

    return (
      <div className="grid gap-6">
        <div className="future-panel-strong overflow-hidden rounded-3xl p-5 md:p-6">
          <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
            <GameImage
              image={resultImage}
              name={prices.name}
              className="aspect-[16/7] w-full rounded-2xl md:aspect-[460/215]"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-[var(--future-line)] bg-white/[0.06] text-[var(--future-ink)] hover:bg-white/[0.06]">
                  AppID {prices.appid}
                </Badge>
                <Badge
                  className={cn(
                    "rounded-full hover:bg-current/0",
                    prices.supportedChinese
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200",
                  )}
                >
                  {prices.supportedChinese ? "支持中文" : "未识别中文支持"}
                </Badge>
                <Badge className="rounded-full border-[var(--future-line)] bg-white/[0.06] text-[var(--future-muted)] hover:bg-white/[0.06]">
                  <Clock3 className="mr-1.5 size-3" />
                  {getQueryTime(prices.queriedAt)}
                </Badge>
              </div>

              <h2 className="mt-4 truncate text-3xl font-black leading-tight text-[var(--future-ink)] md:text-4xl">
                {prices.name}
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MetricBlock
                  label="国区基准"
                  value={prices.chinaPriceFormatted}
                />
                <MetricBlock
                  label="可比价区域"
                  value={`${availableRows.length}/${prices.regions.length}`}
                />
              </div>
              <div className="mt-5 rounded-2xl border border-[var(--future-line)] bg-[var(--future-accent-soft)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--future-ink)]">
                {prices.conclusion}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-[var(--future-line)] bg-white/[0.04]"
                >
                  <Link href={prices.steamUrl} target="_blank" rel="noreferrer">
                    打开 Steam
                    <ExternalLink className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadPrices(prices.appid)}
                  disabled={priceStatus === "loading"}
                  className="rounded-full border-[var(--future-line)] bg-white/[0.04]"
                >
                  <RefreshCcw
                    className={cn(
                      "mr-2 size-4",
                      priceStatus === "loading" && "animate-spin",
                    )}
                  />
                  刷新价格
                </Button>
              </div>
            </div>
          </div>
        </div>

        <PriceTable rows={prices.regions} />
      </div>
    );
  }
}

function SteamDealsPanel({
  deals,
  error,
  limit,
  onLimitChange,
  onRefresh,
  status,
}: {
  deals: SteamDealsResponse | null;
  error: string | null;
  limit: DealLimit;
  onLimitChange: (limit: DealLimit) => void;
  onRefresh: () => Promise<void>;
  status: DealsStatus;
}) {
  const isLoading = status === "loading";
  const giveaways = deals?.giveaways ?? [];
  const discounts = deals?.discounts ?? [];
  const discountStatusLabel =
    isLoading && deals
      ? `正在刷新为最多 ${limit} 个热门折扣...`
      : discounts.length >= limit
        ? `已展示 ${discounts.length} 个热门折扣`
        : `Steam 当前仅返回 ${discounts.length} 个国区热门折扣`;

  return (
    <div className="future-panel-strong overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-[var(--future-line)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-[var(--future-line)] bg-[var(--future-accent-soft)] text-[var(--future-accent)]">
              <BadgePercent className="size-5" />
            </span>
            <div>
              <p className="future-label">CN Deals</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--future-ink)]">
                国区优惠雷达
              </h2>
            </div>
          </div>
          <p className="future-muted mt-3 max-w-2xl text-sm leading-6">
            实时读取 Steam 国区热门与特惠区块，按 Steam
            当前热度/推荐顺序截取展示；领取和购买会跳转到 Steam 官方页面完成。
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center md:w-auto md:justify-end">
          <div className="flex items-center gap-2 rounded-full border border-[var(--future-line)] bg-white/[0.04] px-3 py-2">
            <span className="future-muted whitespace-nowrap text-xs font-semibold">
              显示
            </span>
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                const nextLimit = Number(value);

                if (isDealLimit(nextLimit)) {
                  onLimitChange(nextLimit);
                }
              }}
            >
              <SelectTrigger className="h-9 w-[96px] rounded-full border-[var(--future-line)] bg-white/[0.04] px-3">
                <SelectValue aria-label={`显示 ${limit} 个`} />
              </SelectTrigger>
              <SelectContent className="z-[80]">
                {dealLimitOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} 个
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {deals && (
            <Badge className="rounded-full border-[var(--future-line)] bg-white/[0.06] text-[var(--future-muted)] hover:bg-white/[0.06]">
              <Clock3 className="mr-1.5 size-3" />
              {getQueryTime(deals.queriedAt)}
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRefresh()}
            disabled={isLoading}
            className="rounded-full border-[var(--future-line)] bg-white/[0.04]"
          >
            <RefreshCcw
              className={cn("mr-2 size-4", isLoading && "animate-spin")}
            />
            刷新优惠
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:p-6">
        {status === "error" && !deals && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-700 dark:text-red-200">
            {error ?? "Steam 优惠加载失败，请稍后再试。"}
          </div>
        )}

        {isLoading && !deals && <DealsSkeleton />}

        {deals && (
          <>
            <section className="rounded-2xl border border-[var(--future-line)] bg-white/[0.03] p-4">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="future-label">Giveaways</p>
                  <h3 className="mt-1 text-xl font-black text-[var(--future-ink)]">
                    免费喜加一
                  </h3>
                </div>
                <Badge className="w-fit rounded-full border-emerald-400/30 bg-emerald-400/10 text-emerald-700 hover:bg-emerald-400/10 dark:text-emerald-200">
                  <Gift className="mr-1.5 size-3" />
                  {giveaways.length ? `${giveaways.length} 个可领取` : "暂无"}
                </Badge>
              </div>

              {giveaways.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {giveaways.map((deal) => (
                    <DealCard key={deal.appid} deal={deal} featured />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--future-line)] p-4 text-sm text-[var(--future-muted)]">
                  当前未发现国区 100% off 限时领取项。
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="future-label">Popular Specials</p>
                  <h3 className="mt-1 text-xl font-black text-[var(--future-ink)]">
                    热门折扣游戏
                  </h3>
                </div>
                <p className="future-muted text-sm">
                  {discounts.length ? `显示上限 ${limit} 个` : ""}
                </p>
              </div>

              {discounts.length ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {discounts.map((deal) => (
                      <DealCard key={deal.appid} deal={deal} />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--future-line)] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[var(--future-muted)]">
                    <Flame className="size-4 text-[var(--future-accent)]" />
                    {discountStatusLabel}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--future-line)] p-4 text-sm text-[var(--future-muted)]">
                  当前没有拿到 Steam 国区热门折扣数据。
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  featured = false,
}: {
  deal: SteamDealItem;
  featured?: boolean;
}) {
  return (
    <article
      data-deal-card={featured ? undefined : ""}
      className="group overflow-hidden rounded-2xl border border-[var(--future-line)] bg-white/[0.04]"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-black/[0.14]">
        {deal.image ? (
          <img
            src={deal.image}
            alt={deal.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <Gamepad2 className="size-8 text-[var(--future-muted)]" />
          </div>
        )}
        <Badge
          className={cn(
            "absolute left-3 top-3 rounded-full",
            featured
              ? "border-emerald-400/30 bg-emerald-500 text-white hover:bg-emerald-500"
              : "border-[var(--future-line)] bg-[var(--future-accent)] text-white hover:bg-[var(--future-accent)]",
          )}
        >
          {featured ? (
            <Gift className="mr-1.5 size-3" />
          ) : (
            <Flame className="mr-1.5 size-3" />
          )}
          -{deal.discountPercent}%
        </Badge>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 text-base font-black leading-6 text-[var(--future-ink)]">
              {deal.name}
            </h4>
            <p className="future-muted mt-1 font-mono text-xs">
              AppID {deal.appid} · {getPlatformLabel(deal)}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full border-[var(--future-line)] bg-white/[0.04]"
          >
            <Link href={deal.steamUrl} target="_blank" rel="noreferrer">
              {featured ? "领取" : "查看"}
              <ExternalLink className="ml-1.5 size-3" />
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[var(--future-muted)] line-through">
              {deal.originalFormatted}
            </p>
            <p className="mt-1 font-mono text-xl font-black text-[var(--future-ink)]">
              {featured ? "免费领取" : deal.finalFormatted}
            </p>
          </div>
          <div className="text-right">
            <p className="future-label">Ends</p>
            <p className="mt-1 text-xs font-semibold text-[var(--future-muted)]">
              {getDealTime(deal.discountEndsAt)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function DealsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-[var(--future-line)] bg-white/[0.04]"
        >
          <Skeleton className="aspect-[16/7] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-4">
      <p className="future-label">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--future-ink)]">
        {value}
      </p>
    </div>
  );
}

function GameImage({
  className,
  image,
  name,
}: {
  className?: string;
  image: string | null;
  name: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border border-[var(--future-line)] bg-black/[0.12]",
        className,
      )}
    >
      {image ? (
        <img src={image} alt={name} className="size-full object-cover" />
      ) : (
        <Gamepad2 className="size-6 text-[var(--future-muted)]" />
      )}
    </div>
  );
}

function PriceSkeleton() {
  return (
    <div className="future-panel-strong rounded-3xl p-5 md:p-6">
      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <Skeleton className="aspect-[16/7] rounded-2xl md:aspect-[460/215]" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-48 rounded-full" />
          <Skeleton className="h-10 w-2/3 rounded-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function PriceTable({ rows }: { rows: SteamRegionPrice[] }) {
  return (
    <div className="future-panel-strong overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-[var(--future-line)] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="future-label">Regional Ranking</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--future-ink)]">
            全区官方价排行
          </h2>
        </div>
        <p className="future-muted max-w-xl text-sm leading-6">
          排名仅基于可折算人民币的 Steam
          官方价格；未售、无价格或汇率缺失区域排在后方。
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px]">排名</TableHead>
            <TableHead>区域</TableHead>
            <TableHead>折合人民币</TableHead>
            <TableHead>vs 国区</TableHead>
            <TableHead>Steam 官方地区定价</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const StatusIcon = getStatusIcon(row.status);

            return (
              <TableRow
                key={row.id}
                data-price-row
                className={cn(
                  "group",
                  row.id === "cn" && "bg-[var(--future-accent-soft)]",
                  row.rank === 1 && "border-[var(--future-accent)]",
                )}
              >
                <TableCell className="font-mono text-sm font-bold text-[var(--future-accent)]">
                  {getRankLabel(row.rank)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{row.flag}</span>
                    <div>
                      <p className="font-semibold text-[var(--future-ink)]">
                        {row.region}
                      </p>
                      <p className="future-muted font-mono text-xs uppercase">
                        {row.cc}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-base font-bold text-[var(--future-ink)]">
                  {row.cnyFormatted}
                </TableCell>
                <TableCell
                  className={cn(
                    "font-mono text-sm font-bold",
                    getVsTone(row.vsChina, row.id),
                  )}
                >
                  {row.vsChinaFormatted}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm text-[var(--future-ink)]">
                    {row.officialFormatted}
                  </div>
                  {row.discountPercent > 0 && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                      -{row.discountPercent}%
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full hover:bg-current/0",
                      statusTone[row.status],
                    )}
                  >
                    <StatusIcon className="mr-1.5 size-3" />
                    {row.statusLabel}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

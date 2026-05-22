import type {
  SteamDealItem,
  SteamDealsResponse,
  SteamPriceStatus,
  SteamPricesResponse,
  SteamRegionPrice,
  SteamSearchResult,
} from "../types";

const STEAM_STORE_SEARCH_URL =
  "https://store.steampowered.com/api/storesearch/";
const STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const STEAM_FEATURED_CATEGORIES_URL =
  "https://store.steampowered.com/api/featuredcategories";
const FRANKFURTER_LATEST_URL = "https://api.frankfurter.dev/v1/latest";
const REQUEST_TIMEOUT_MS = 10_000;
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const PRICE_CACHE_TTL_MS = 8 * 60 * 1000;
const DEALS_CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const STEAM_DEAL_LIMITS = [10, 20, 30, 50, 100] as const;
export const DEFAULT_STEAM_DEAL_LIMIT = 10;

const DEFAULT_HEADERS = {
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.75",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
};

const STEAM_REGIONS = [
  { id: "cn", cc: "cn", flag: "🇨🇳", region: "中国" },
  { id: "ar", cc: "ar", flag: "🇦🇷", region: "阿根廷" },
  { id: "tr", cc: "tr", flag: "🇹🇷", region: "土耳其" },
  { id: "ua", cc: "ua", flag: "🇺🇦", region: "乌克兰" },
  { id: "in", cc: "in", flag: "🇮🇳", region: "印度" },
  { id: "jp", cc: "jp", flag: "🇯🇵", region: "日本" },
  { id: "br", cc: "br", flag: "🇧🇷", region: "巴西" },
  { id: "kz", cc: "kz", flag: "🇰🇿", region: "哈萨克斯坦" },
  { id: "hk", cc: "hk", flag: "🇭🇰", region: "香港" },
  { id: "us", cc: "us", flag: "🇺🇸", region: "美国" },
  { id: "za", cc: "za", flag: "🇿🇦", region: "南非" },
  { id: "co", cc: "co", flag: "🇨🇴", region: "哥伦比亚" },
] as const;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

type SteamPriceOverview = {
  currency: string;
  initial: number;
  final: number;
  discount_percent?: number;
  initial_formatted?: string;
  final_formatted?: string;
};

type SteamAppDetails = {
  type?: string;
  name?: string;
  steam_appid?: number;
  is_free?: boolean;
  supported_languages?: string;
  header_image?: string;
  capsule_image?: string;
  capsule_imagev5?: string;
  price_overview?: SteamPriceOverview;
};

type RegionFetchResult = {
  id: (typeof STEAM_REGIONS)[number]["id"];
  cc: string;
  flag: string;
  region: string;
  price: SteamPriceOverview | null;
  status: SteamPriceStatus;
  error: string | null;
};

type ExchangeRateData = {
  date: string | null;
  rates: Map<string, number>;
};

type FeaturedStoreItem = {
  id: number;
  name: string;
  type: number | null;
  discounted: boolean;
  discount_percent: number;
  original_price: number | null;
  final_price: number | null;
  currency: string | null;
  large_capsule_image: string | null;
  small_capsule_image: string | null;
  header_image: string | null;
  discount_expiration: number | null;
  windows_available: boolean;
  mac_available: boolean;
  linux_available: boolean;
};

const cache = new Map<string, CacheEntry<unknown>>();

const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
};

const setCached = <T>(key: string, data: T, ttlMs: number) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

export type SteamDealLimit = (typeof STEAM_DEAL_LIMITS)[number];

export const normalizeSteamDealLimit = (
  value: number | string | null | undefined,
): SteamDealLimit => {
  const limit =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : DEFAULT_STEAM_DEAL_LIMIT;

  return STEAM_DEAL_LIMITS.includes(limit as SteamDealLimit)
    ? (limit as SteamDealLimit)
    : DEFAULT_STEAM_DEAL_LIMIT;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
};

const getNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getBoolean = (value: unknown): boolean =>
  typeof value === "boolean" ? value : false;

const createUrl = (base: string, query: Record<string, number | string>) => {
  const url = new URL(base);

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

export const parseSteamAppId = (value: string) => {
  const text = value.trim();
  const urlMatch = /store\.steampowered\.com\/app\/(\d{2,10})/i.exec(text);

  if (urlMatch?.[1]) return Number(urlMatch[1]);

  if (/^\d{2,10}$/.test(text)) return Number(text);

  return null;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasChineseSupport = (supportedLanguages?: string) => {
  if (!supportedLanguages) return false;

  const text = stripHtml(supportedLanguages).toLowerCase();
  return /简体中文|繁体中文|simplified chinese|traditional chinese|schinese|tchinese|中文/.test(
    text,
  );
};

const normalizePrice = (value: unknown): SteamPriceOverview | null => {
  if (!isRecord(value)) return null;

  const currency = getString(value.currency);
  const initial = getNumber(value.initial);
  const final = getNumber(value.final);

  if (!currency || initial === null || final === null) return null;

  return {
    currency,
    initial,
    final,
    discount_percent: getNumber(value.discount_percent) ?? 0,
    initial_formatted: getString(value.initial_formatted) ?? undefined,
    final_formatted: getString(value.final_formatted) ?? undefined,
  };
};

const normalizeSearchResult = (item: unknown): SteamSearchResult | null => {
  if (!isRecord(item)) return null;

  const appid = getNumber(item.id);
  const name = getString(item.name);

  if (!appid || !name) return null;

  const platforms = isRecord(item.platforms) ? item.platforms : {};
  const price = isRecord(item.price) ? item.price : null;
  const finalFormatted = price
    ? (getString(price.final_formatted) ?? getString(price.initial_formatted))
    : null;

  return {
    appid,
    name,
    type: getString(item.type) ?? "app",
    image: getString(item.tiny_image),
    price: finalFormatted,
    platforms: {
      windows: getBoolean(platforms.windows),
      mac: getBoolean(platforms.mac),
      linux: getBoolean(platforms.linux),
    },
  };
};

const normalizeAppDetails = (value: unknown): SteamAppDetails | null => {
  if (!isRecord(value)) return null;

  return {
    type: getString(value.type) ?? undefined,
    name: getString(value.name) ?? undefined,
    steam_appid: getNumber(value.steam_appid) ?? undefined,
    is_free: getBoolean(value.is_free),
    supported_languages: getString(value.supported_languages) ?? undefined,
    header_image: getString(value.header_image) ?? undefined,
    capsule_image: getString(value.capsule_image) ?? undefined,
    capsule_imagev5: getString(value.capsule_imagev5) ?? undefined,
    price_overview: normalizePrice(value.price_overview) ?? undefined,
  };
};

const normalizeFeaturedStoreItem = (
  value: unknown,
): FeaturedStoreItem | null => {
  if (!isRecord(value)) return null;

  const id = getNumber(value.id);
  const name = getString(value.name);

  if (!id || !name) return null;

  return {
    id,
    name,
    type: getNumber(value.type),
    discounted: getBoolean(value.discounted),
    discount_percent: getNumber(value.discount_percent) ?? 0,
    original_price: getNumber(value.original_price),
    final_price: getNumber(value.final_price),
    currency: getString(value.currency),
    large_capsule_image: getString(value.large_capsule_image),
    small_capsule_image: getString(value.small_capsule_image),
    header_image: getString(value.header_image),
    discount_expiration: getNumber(value.discount_expiration),
    windows_available: getBoolean(value.windows_available),
    mac_available: getBoolean(value.mac_available),
    linux_available: getBoolean(value.linux_available),
  };
};

const fetchAppDetails = async ({
  appid,
  cc,
  filters,
  language = "schinese",
}: {
  appid: number;
  cc: string;
  filters: string;
  language?: string;
}) => {
  const payload = await fetchJson<unknown>(
    createUrl(STEAM_APP_DETAILS_URL, {
      appids: appid,
      cc,
      filters,
      l: language,
    }),
  );

  const entry = isRecord(payload) ? payload[String(appid)] : null;

  if (!isRecord(entry) || entry.success !== true) {
    return null;
  }

  return normalizeAppDetails(entry.data);
};

const getImageFromDetails = (details: SteamAppDetails) =>
  details.header_image ??
  details.capsule_imagev5 ??
  details.capsule_image ??
  null;

const getSearchResultFromAppId = async (appid: number) => {
  const details = await fetchAppDetails({
    appid,
    cc: "cn",
    filters: "basic,price_overview",
  });

  if (!details?.name) return null;

  return {
    appid,
    name: details.name,
    type: details.type ?? "app",
    image: getImageFromDetails(details),
    price: details.price_overview?.final_formatted ?? null,
    platforms: {
      windows: false,
      mac: false,
      linux: false,
    },
  } satisfies SteamSearchResult;
};

const dedupeSearchResults = (items: SteamSearchResult[]) => {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.appid)) return false;
    seen.add(item.appid);
    return true;
  });
};

export const searchSteamGames = async (query: string) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return [];

  const cacheKey = `steam-search:${normalizedQuery.toLowerCase()}`;
  const cached = getCached<SteamSearchResult[]>(cacheKey);

  if (cached) return cached;

  const appid = parseSteamAppId(normalizedQuery);

  if (appid) {
    const result = await getSearchResultFromAppId(appid);
    const data = result ? [result] : [];
    setCached(cacheKey, data, SEARCH_CACHE_TTL_MS);
    return data;
  }

  const urls = [
    createUrl(STEAM_STORE_SEARCH_URL, {
      term: normalizedQuery,
      l: "schinese",
      cc: "cn",
    }),
    createUrl(STEAM_STORE_SEARCH_URL, {
      term: normalizedQuery,
      l: "english",
      cc: "us",
    }),
  ];

  const responses = await Promise.allSettled(
    urls.map((url) => fetchJson<unknown>(url)),
  );
  const results = responses.flatMap((response) => {
    if (response.status !== "fulfilled" || !isRecord(response.value)) {
      return [];
    }

    const items = Array.isArray(response.value.items)
      ? response.value.items
      : [];

    return items.flatMap((item) => {
      const result = normalizeSearchResult(item);
      return result ? [result] : [];
    });
  });
  const data = dedupeSearchResults(results).slice(0, 10);

  setCached(cacheKey, data, SEARCH_CACHE_TTL_MS);
  return data;
};

const getPriceStatusLabel = (status: SteamPriceStatus) => {
  if (status === "available") return "Live";
  if (status === "exchange_missing") return "汇率缺失";
  if (status === "free") return "免费";
  if (status === "no_price") return "无价格";
  if (status === "unavailable") return "未售";
  return "请求失败";
};

const fetchRegionPrice = async ({
  appid,
  isFree,
  region,
}: {
  appid: number;
  isFree: boolean;
  region: (typeof STEAM_REGIONS)[number];
}): Promise<RegionFetchResult> => {
  try {
    const details = await fetchAppDetails({
      appid,
      cc: region.cc,
      filters: "price_overview",
    });

    if (!details) {
      return {
        ...region,
        price: null,
        status: "unavailable",
        error: null,
      };
    }

    if (details.price_overview) {
      return {
        ...region,
        price: details.price_overview,
        status: "available",
        error: null,
      };
    }

    return {
      ...region,
      price: null,
      status: isFree ? "free" : "no_price",
      error: null,
    };
  } catch (error) {
    return {
      ...region,
      price: null,
      status: "error",
      error: error instanceof Error ? error.message : "Steam request failed",
    };
  }
};

const fetchExchangeRates = async (): Promise<ExchangeRateData> => {
  const cached = getCached<ExchangeRateData>("steam-rates:cny");

  if (cached) return cached;

  try {
    const payload = await fetchJson<unknown>(
      createUrl(FRANKFURTER_LATEST_URL, { base: "CNY" }),
    );

    if (!isRecord(payload) || !isRecord(payload.rates)) {
      throw new Error("Invalid rate response");
    }

    const rates = new Map<string, number>();

    Object.entries(payload.rates).forEach(([currency, value]) => {
      const rate = getNumber(value);

      if (rate && rate > 0) {
        rates.set(currency.toUpperCase(), rate);
      }
    });

    const data = {
      date: getString(payload.date),
      rates,
    };

    setCached("steam-rates:cny", data, RATE_CACHE_TTL_MS);
    return data;
  } catch {
    return {
      date: null,
      rates: new Map<string, number>(),
    };
  }
};

const getPriceAmount = (price: SteamPriceOverview) => price.final / 100;

const formatCny = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "--";

  return new Intl.NumberFormat("zh-CN", {
    currency: "CNY",
    maximumFractionDigits: value >= 100 ? 0 : 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
};

const formatStoreCny = (value: number | null) =>
  value === null ? "--" : formatCny(value / 100);

const getFeaturedCategoryItems = (payload: unknown, key: string) => {
  if (!isRecord(payload)) return [];

  const category = payload[key];

  if (!isRecord(category) || !Array.isArray(category.items)) return [];

  return category.items.flatMap((item) => {
    const result = normalizeFeaturedStoreItem(item);
    return result ? [result] : [];
  });
};

const dedupeFeaturedItems = (items: FeaturedStoreItem[]) => {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.id)) return false;

    seen.add(item.id);
    return true;
  });
};

const isGiveawayDeal = (item: FeaturedStoreItem) =>
  item.type === 0 &&
  item.original_price !== null &&
  item.original_price > 0 &&
  item.final_price === 0 &&
  item.discount_percent >= 100;

const isDiscountDeal = (item: FeaturedStoreItem) =>
  item.type === 0 &&
  item.final_price !== null &&
  item.final_price > 0 &&
  (item.discounted || item.discount_percent > 0);

const toDealItem = (item: FeaturedStoreItem): SteamDealItem => ({
  appid: item.id,
  name: item.name,
  image:
    item.large_capsule_image ?? item.header_image ?? item.small_capsule_image,
  steamUrl: `https://store.steampowered.com/app/${item.id}`,
  discountPercent: item.discount_percent,
  originalPrice:
    item.original_price !== null ? item.original_price / 100 : null,
  finalPrice: item.final_price !== null ? item.final_price / 100 : null,
  originalFormatted: formatStoreCny(item.original_price),
  finalFormatted: formatStoreCny(item.final_price),
  discountEndsAt: item.discount_expiration
    ? new Date(item.discount_expiration * 1000).toISOString()
    : null,
  platforms: {
    windows: item.windows_available,
    mac: item.mac_available,
    linux: item.linux_available,
  },
});

export const getSteamDeals = async (
  requestedLimit: number | string = DEFAULT_STEAM_DEAL_LIMIT,
): Promise<SteamDealsResponse> => {
  const limit = normalizeSteamDealLimit(requestedLimit);
  const cacheKey = `steam-deals:cn:v3:${limit}`;
  const cached = getCached<SteamDealsResponse>(cacheKey);

  if (cached) return cached;

  const payload = await fetchJson<unknown>(
    createUrl(STEAM_FEATURED_CATEGORIES_URL, {
      cc: "cn",
      l: "schinese",
    }),
  );
  const topSellers = getFeaturedCategoryItems(payload, "top_sellers");
  const specials = getFeaturedCategoryItems(payload, "specials");
  const rankedItems = dedupeFeaturedItems([...topSellers, ...specials]);
  const giveaways = rankedItems.filter(isGiveawayDeal).map(toDealItem);
  const discounts = rankedItems
    .filter((item) => !isGiveawayDeal(item) && isDiscountDeal(item))
    .map(toDealItem)
    .slice(0, limit);
  const data: SteamDealsResponse = {
    queriedAt: new Date().toISOString(),
    source: "Steam Store Featured Categories CN",
    giveaways: giveaways.slice(0, 6),
    discounts,
  };

  setCached(cacheKey, data, DEALS_CACHE_TTL_MS);
  return data;
};

const formatDifference = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "--";
  if (Math.abs(value) < 0.5) return "基准";

  const prefix = value > 0 ? "贵" : "便宜";
  return `${prefix}${formatCny(Math.abs(value))}`;
};

const createOfficialPriceLabel = (
  price: SteamPriceOverview | null,
  status: SteamPriceStatus,
) => {
  if (status === "free") return "Free";
  if (!price) return "--";

  return (
    price.final_formatted ??
    `${price.currency.toUpperCase()} ${getPriceAmount(price).toFixed(2)}`
  );
};

const convertToCny = ({
  currency,
  price,
  rates,
}: {
  currency: string;
  price: number;
  rates: Map<string, number>;
}) => {
  const normalizedCurrency = currency.toUpperCase();

  if (normalizedCurrency === "CNY") return price;

  const rate = rates.get(normalizedCurrency);

  if (!rate) return null;

  return price / rate;
};

const getConclusion = ({
  chinaPrice,
  isFree,
  lowest,
}: {
  chinaPrice: number | null;
  isFree: boolean;
  lowest: SteamRegionPrice | undefined;
}) => {
  if (isFree) return "该游戏为免费游玩，无需跨区比价。";
  if (chinaPrice === null) {
    return "国区暂无可用官方价格，建议直接打开 Steam 商店确认。";
  }
  if (!lowest?.cnyPrice) {
    return "当前没有拿到可比价的区域价格，请稍后刷新重试。";
  }
  if (lowest.id === "cn" || Math.abs(lowest.cnyPrice - chinaPrice) < 0.5) {
    return "国区已是最低价，无需跨区购买。";
  }

  return `${lowest.region} 当前折合最低，约比国区低 ${formatCny(
    chinaPrice - lowest.cnyPrice,
  )}；跨区购买仍存在账号与余额风险。`;
};

export const getSteamPrices = async (
  appid: number,
): Promise<SteamPricesResponse> => {
  if (!Number.isInteger(appid) || appid <= 0) {
    throw new Error("Invalid Steam appid");
  }

  const cacheKey = `steam-prices:${appid}`;
  const cached = getCached<SteamPricesResponse>(cacheKey);

  if (cached) return cached;

  const details = await fetchAppDetails({
    appid,
    cc: "cn",
    filters: "basic,price_overview",
  });

  if (!details?.name) {
    throw new Error("Steam app not found");
  }

  const isFree = details.is_free === true;
  const [regionResults, exchangeRates] = await Promise.all([
    Promise.all(
      STEAM_REGIONS.map((region) =>
        fetchRegionPrice({
          appid,
          isFree,
          region,
        }),
      ),
    ),
    fetchExchangeRates(),
  ]);

  const rows = regionResults.map<SteamRegionPrice>((result) => {
    const officialPrice = result.price ? getPriceAmount(result.price) : null;
    const currency = result.price?.currency.toUpperCase() ?? null;
    const converted =
      currency && officialPrice !== null
        ? convertToCny({
            currency,
            price: officialPrice,
            rates: exchangeRates.rates,
          })
        : result.status === "free"
          ? 0
          : null;
    const status =
      result.status === "available" && converted === null
        ? "exchange_missing"
        : result.status;

    return {
      id: result.id,
      cc: result.cc,
      flag: result.flag,
      region: result.region,
      rank: null,
      currency,
      officialPrice,
      officialFormatted: createOfficialPriceLabel(result.price, result.status),
      cnyPrice: converted,
      cnyFormatted: formatCny(converted),
      vsChina: null,
      vsChinaFormatted: "--",
      discountPercent: result.price?.discount_percent ?? 0,
      status,
      statusLabel: getPriceStatusLabel(status),
      error: result.error,
    };
  });

  const chinaPrice = rows.find((row) => row.id === "cn")?.cnyPrice ?? null;
  const rankedRows = rows
    .filter((row) => row.cnyPrice !== null)
    .sort((first, second) => {
      const firstPrice = first.cnyPrice ?? Number.MAX_SAFE_INTEGER;
      const secondPrice = second.cnyPrice ?? Number.MAX_SAFE_INTEGER;
      return firstPrice - secondPrice;
    });

  rankedRows.forEach((row, index) => {
    row.rank = index + 1;
  });

  rows.forEach((row) => {
    if (chinaPrice === null || row.cnyPrice === null) {
      row.vsChina = null;
      row.vsChinaFormatted = row.id === "cn" ? "基准" : "--";
      return;
    }

    row.vsChina = row.cnyPrice - chinaPrice;
    row.vsChinaFormatted =
      row.id === "cn" ? "基准" : formatDifference(row.vsChina);
  });

  const sortedRows = [...rows].sort((first, second) => {
    if (first.rank !== null && second.rank !== null) {
      return first.rank - second.rank;
    }
    if (first.rank !== null) return -1;
    if (second.rank !== null) return 1;

    return (
      STEAM_REGIONS.findIndex((region) => region.id === first.id) -
      STEAM_REGIONS.findIndex((region) => region.id === second.id)
    );
  });
  const lowest = sortedRows.find((row) => row.rank === 1);
  const data: SteamPricesResponse = {
    appid,
    name: details.name,
    type: details.type ?? "game",
    image: getImageFromDetails(details),
    steamUrl: `https://store.steampowered.com/app/${appid}`,
    queriedAt: new Date().toISOString(),
    supportedChinese: hasChineseSupport(details.supported_languages),
    chinaPrice,
    chinaPriceFormatted: formatCny(chinaPrice),
    conclusion: getConclusion({
      chinaPrice,
      isFree,
      lowest,
    }),
    ratesUpdatedAt: exchangeRates.date,
    regions: sortedRows,
  };

  setCached(cacheKey, data, PRICE_CACHE_TTL_MS);
  return data;
};

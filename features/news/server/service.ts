import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { newsFetchers } from "./fetchers";
import { newsSourceIds, newsSourceMap } from "./sources";

import type {
  NewsItem,
  NewsItemsResponse,
  NewsPreference,
  SavedNewsItem,
} from "../types";

const FORCE_REFRESH_MIN_INTERVAL = 2 * 60 * 1000;

const toTimestamp = (date?: Date | string | number | null) => {
  if (!date) return 0;
  if (date instanceof Date) return date.getTime();
  if (typeof date === "number") return date;
  return Date.parse(date);
};

const toOptionalDate = (date?: Date | string | number | null) => {
  const timestamp = toTimestamp(date);
  return Number.isFinite(timestamp) && timestamp > 0
    ? new Date(timestamp)
    : undefined;
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : "Unexpected news error";
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getString = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
};

type NewsItemBadgeTone = NonNullable<
  NonNullable<NewsItem["extra"]>["badges"]
>[number]["tone"];

const parseCachedBadgeTone = (value: unknown): NewsItemBadgeTone => {
  if (
    value === "default" ||
    value === "exclusive" ||
    value === "hot" ||
    value === "live" ||
    value === "new"
  ) {
    return value;
  }

  return undefined;
};

const parseCachedExtra = (value: unknown): NewsItem["extra"] => {
  if (!isRecord(value)) return undefined;

  const icon =
    typeof value.icon === "string" || value.icon === false
      ? value.icon
      : isRecord(value.icon) &&
          typeof value.icon.url === "string" &&
          typeof value.icon.scale === "number"
        ? { url: value.icon.url, scale: value.icon.scale }
        : undefined;
  const badges = Array.isArray(value.badges)
    ? value.badges.flatMap((badge) => {
        if (!isRecord(badge) || typeof badge.label !== "string") return [];
        const tone = parseCachedBadgeTone(badge.tone);

        return [
          {
            label: badge.label,
            ...(tone ? { tone } : {}),
          },
        ];
      })
    : undefined;

  return {
    hover: typeof value.hover === "string" ? value.hover : undefined,
    date:
      typeof value.date === "string" || typeof value.date === "number"
        ? value.date
        : undefined,
    info:
      typeof value.info === "string"
        ? value.info
        : value.info === false
          ? false
          : undefined,
    diff: typeof value.diff === "number" ? value.diff : undefined,
    icon,
    badges,
  };
};

const parseCachedItems = (value: Prisma.JsonValue): NewsItem[] => {
  if (!Array.isArray(value)) return [];

  const records: Record<string, unknown>[] = [];

  value.forEach((item) => {
    if (isRecord(item)) {
      records.push(item);
    }
  });

  return records
    .map((item) => ({
      id: getString(item.id),
      title: getString(item.title),
      url: getString(item.url),
      mobileUrl:
        typeof item.mobileUrl === "string" ? item.mobileUrl : undefined,
      pubDate:
        typeof item.pubDate === "string" || typeof item.pubDate === "number"
          ? item.pubDate
          : undefined,
      extra: parseCachedExtra(item.extra),
    }))
    .filter((item) => item.id && item.title && item.url);
};

const sourceResponseFromCache = (
  sourceId: string,
  cache: { data: Prisma.JsonValue; fetchedAt: Date; error: string | null },
  status: NewsItemsResponse["status"] = "cache",
): NewsItemsResponse => ({
  status,
  id: sourceId,
  updatedTime: cache.fetchedAt.getTime(),
  items: parseCachedItems(cache.data),
  error: cache.error ?? undefined,
});

export const getDefaultNewsPreference = (): NewsPreference => ({
  sourceOrder: newsSourceIds,
  hiddenSources: [],
  defaultColumn: null,
});

export const sanitizePreference = (
  preference: Partial<NewsPreference>,
): NewsPreference => {
  const validSourceIds = new Set(newsSourceIds);

  const sourceOrder = Array.from(
    new Set(
      (preference.sourceOrder ?? []).filter((sourceId) =>
        validSourceIds.has(sourceId),
      ),
    ),
  );
  const hiddenSources = Array.from(
    new Set(
      (preference.hiddenSources ?? []).filter((sourceId) =>
        validSourceIds.has(sourceId),
      ),
    ),
  );

  return {
    sourceOrder: [
      ...sourceOrder,
      ...newsSourceIds.filter((sourceId) => !sourceOrder.includes(sourceId)),
    ],
    hiddenSources,
    defaultColumn: null,
  };
};

export const getNewsPreference = async (
  userId: string,
): Promise<NewsPreference> => {
  const preference = await prisma.newsUserPreference.findUnique({
    where: { userId },
  });

  if (!preference) return getDefaultNewsPreference();

  return sanitizePreference({
    sourceOrder: preference.sourceOrder,
    hiddenSources: preference.hiddenSources,
    defaultColumn: preference.defaultColumn,
  });
};

export const upsertNewsPreference = async (
  userId: string,
  preference: Partial<NewsPreference>,
) => {
  const data = sanitizePreference(preference);

  await prisma.newsUserPreference.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });

  return data;
};

export const getNewsItems = async ({
  sourceId,
  latest,
  viewerId,
}: {
  sourceId: string;
  latest: boolean;
  viewerId?: string;
}): Promise<NewsItemsResponse> => {
  const source = newsSourceMap.get(sourceId);
  const fetcher = newsFetchers[sourceId];

  if (!source || !fetcher) {
    throw new Error("Invalid source id");
  }

  const now = Date.now();
  let cache: Awaited<ReturnType<typeof prisma.newsSourceCache.findUnique>> =
    null;
  let cacheError: string | undefined;

  try {
    cache = await prisma.newsSourceCache.findUnique({
      where: { sourceId },
    });
  } catch (error) {
    cacheError = getErrorMessage(error);
  }

  if (cache) {
    const cacheAge = now - cache.fetchedAt.getTime();

    if (!viewerId) {
      return sourceResponseFromCache(sourceId, cache, "cache");
    }

    if (!latest && cacheAge < source.intervalMs) {
      return sourceResponseFromCache(sourceId, cache, "cache");
    }

    if (latest && cacheAge < FORCE_REFRESH_MIN_INTERVAL) {
      return sourceResponseFromCache(sourceId, cache, "rate_limited");
    }
  } else if (!viewerId) {
    return {
      status: "empty",
      id: sourceId,
      updatedTime: now,
      items: [],
      error: cacheError,
    };
  }

  try {
    const items = await fetcher();

    try {
      await prisma.newsSourceCache.upsert({
        where: { sourceId },
        create: {
          sourceId,
          data: items,
          status: "success",
          fetchedAt: new Date(now),
        },
        update: {
          data: items,
          status: "success",
          error: null,
          fetchedAt: new Date(now),
        },
      });
    } catch (error) {
      cacheError = getErrorMessage(error);
    }

    return {
      status: "success",
      id: sourceId,
      updatedTime: now,
      items,
      error: cacheError,
    };
  } catch (error) {
    const message = getErrorMessage(error);

    if (cache) {
      await prisma.newsSourceCache.update({
        where: { sourceId },
        data: {
          status: "error",
          error: message,
        },
      });

      return {
        ...sourceResponseFromCache(sourceId, cache, "cache"),
        error: message,
      };
    }

    throw error;
  }
};

export const serializeSavedItem = (item: {
  id: string;
  sourceId: string;
  itemId: string;
  title: string;
  url: string;
  mobileUrl: string | null;
  excerpt: string | null;
  info: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}): SavedNewsItem => ({
  id: item.id,
  sourceId: item.sourceId,
  itemId: item.itemId,
  title: item.title,
  url: item.url,
  mobileUrl: item.mobileUrl,
  excerpt: item.excerpt,
  info: item.info,
  publishedAt: item.publishedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
});

export const getSavedNewsItems = async (userId: string) => {
  const items = await prisma.newsSavedItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return items.map(serializeSavedItem);
};

export const saveNewsItem = async ({
  userId,
  sourceId,
  item,
}: {
  userId: string;
  sourceId: string;
  item: NewsItem;
}) => {
  if (!newsSourceMap.has(sourceId)) {
    throw new Error("Invalid source id");
  }

  const title = item.title.trim().slice(0, 240);
  const url = item.url.trim();

  if (!title || !/^https?:\/\//.test(url)) {
    throw new Error("Invalid news item");
  }

  const saved = await prisma.newsSavedItem.upsert({
    where: {
      userId_sourceId_itemId: {
        userId,
        sourceId,
        itemId: String(item.id),
      },
    },
    create: {
      userId,
      sourceId,
      itemId: String(item.id),
      title,
      url,
      mobileUrl: item.mobileUrl,
      excerpt: item.extra?.hover?.slice(0, 500),
      info: typeof item.extra?.info === "string" ? item.extra.info : undefined,
      publishedAt: toOptionalDate(item.pubDate),
      payload: item,
    },
    update: {
      title,
      url,
      mobileUrl: item.mobileUrl,
      excerpt: item.extra?.hover?.slice(0, 500),
      info: typeof item.extra?.info === "string" ? item.extra.info : undefined,
      publishedAt: toOptionalDate(item.pubDate),
      payload: item,
    },
  });

  return serializeSavedItem(saved);
};

export const deleteSavedNewsItem = async ({
  userId,
  sourceId,
  itemId,
}: {
  userId: string;
  sourceId: string;
  itemId: string;
}) => {
  await prisma.newsSavedItem.deleteMany({
    where: {
      userId,
      sourceId,
      itemId,
    },
  });
};

export type NewsColumnId = "china" | "tech" | "world" | "finance";

export type NewsSourceType = "hottest" | "realtime";

export type NewsSourceColor =
  | "blue"
  | "cyan"
  | "gray"
  | "green"
  | "orange"
  | "red"
  | "slate";

export type NewsSource = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  type: NewsSourceType;
  column: NewsColumnId;
  color: NewsSourceColor;
  home: string;
  intervalMs: number;
};

export type NewsColumn = {
  id: NewsColumnId;
  name: string;
  description: string;
};

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  mobileUrl?: string;
  pubDate?: number | string;
  extra?: {
    hover?: string;
    date?: number | string;
    info?: false | string;
    diff?: number;
    icon?: false | string | { url: string; scale: number };
  };
};

export type NewsResponseStatus = "success" | "cache" | "empty" | "rate_limited";

export type NewsItemsResponse = {
  status: NewsResponseStatus;
  id: string;
  updatedTime: number;
  items: NewsItem[];
  error?: string;
};

export type NewsPreference = {
  sourceOrder: string[];
  hiddenSources: string[];
  defaultColumn: NewsColumnId | null;
};

export type SavedNewsItem = {
  id: string;
  sourceId: string;
  itemId: string;
  title: string;
  url: string;
  mobileUrl: string | null;
  excerpt: string | null;
  info: string | null;
  publishedAt: string | null;
  createdAt: string;
};

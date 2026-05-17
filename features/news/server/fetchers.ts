import { createHash } from "node:crypto";

import type { NewsItem } from "../types";

const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
};

type FetchOptions = RequestInit & {
  json?: boolean;
};

const fetchWithTimeout = async (url: string, options: FetchOptions = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const fetchText = async (url: string, options?: FetchOptions) => {
  const response = await fetchWithTimeout(url, options);
  return response.text();
};

const fetchDecodedText = async (
  url: string,
  encoding: string,
  options?: FetchOptions,
) => {
  const response = await fetchWithTimeout(url, options);
  const buffer = await response.arrayBuffer();
  return new TextDecoder(encoding).decode(buffer);
};

const fetchJson = async <T>(url: string, options?: FetchOptions) => {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      Accept: "application/json,text/plain,*/*",
      ...options?.headers,
    },
  });

  return (await response.json()) as T;
};

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const decodeHtml = (value: string) => {
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&#x([a-f\d]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (_, entity: string) => htmlEntities[entity] ?? _);
};

const decodeJsonText = (value: string) => {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return value.replace(/\\u([\dA-F]{4})/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
  }
};

const stripTags = (value: string) => {
  return decodeHtml(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
};

const toAbsoluteUrl = (base: string, href?: string | null) => {
  if (!href) return undefined;

  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
};

const normalizeItems = (items: NewsItem[]) => {
  const seen = new Set<string>();

  return items
    .map((item) => ({
      ...item,
      id: String(item.id),
      title: item.title.trim(),
      url: item.url.trim(),
    }))
    .filter((item) => {
      if (!item.id || !item.title || !item.url) return false;
      if (!/^https?:\/\//.test(item.url)) return false;
      const key = `${item.id}:${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);
};

const appendQuery = (
  url: string,
  query: Record<string, number | string | undefined>,
) => {
  const target = new URL(url);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      target.searchParams.set(key, String(value));
    }
  });

  return target.toString();
};

const createHashText = (algorithm: "md5" | "sha1", value: string) =>
  createHash(algorithm).update(value).digest("hex");

const encodeBase64 = (value: string) =>
  Buffer.from(value, "utf8").toString("base64");

const createBadges = (
  ...labels: Array<
    | false
    | null
    | string
    | undefined
    | {
        label?: false | null | string;
        tone?: NonNullable<
          NonNullable<NewsItem["extra"]>["badges"]
        >[number]["tone"];
      }
  >
) => {
  const badges = labels.flatMap((entry) => {
    const label =
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object"
          ? entry.label
          : "";
    if (!label) return [];

    const normalized = String(label).trim();
    if (!normalized) return [];

    const tone =
      typeof entry === "object" && entry?.tone
        ? entry.tone
        : normalized.includes("独家")
          ? "exclusive"
          : normalized.includes("直播")
            ? "live"
            : normalized.includes("新")
              ? "new"
              : /热|爆|沸|重要/.test(normalized)
                ? "hot"
                : "default";

    return [{ label: normalized, tone }];
  });

  return badges.length ? badges : undefined;
};

const createClsSearchParams = (moreParams: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams({
    appName: "CailianpressWeb",
    os: "web",
    sv: "7.7.5",
    ...moreParams,
  });
  searchParams.sort();
  searchParams.append(
    "sign",
    createHashText("md5", createHashText("sha1", searchParams.toString())),
  );
  return searchParams;
};

const parseChinaTime = (value?: string) => {
  if (!value) return undefined;

  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (timeMatch) {
    const date = new Date();
    date.setHours(
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      Number(timeMatch[3] ?? 0),
      0,
    );

    if (date.getTime() > Date.now() + 5 * 60_000) {
      date.setDate(date.getDate() - 1);
    }

    return date.getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseLooseDate = (value?: number | string) => {
  if (typeof value === "number") return value;
  if (!value) return undefined;

  const text = stripTags(value).replace(/\s+/g, " ").trim();
  const compact = text.replace(/\s+/g, "");
  const now = Date.now();
  const relativeMatch = /(\d+)\s*(秒|分钟|分|小时|天)前/.exec(compact);

  if (/刚刚|刚才/.test(compact)) return now;
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    if (unit === "秒") return now - amount * 1000;
    if (unit === "分钟" || unit === "分") return now - amount * 60_000;
    if (unit === "小时") return now - amount * 60 * 60_000;
    if (unit === "天") return now - amount * 24 * 60 * 60_000;
  }

  const dayOffsetMatch = /^(昨天|前天)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(
    text,
  );
  if (dayOffsetMatch) {
    const date = new Date();
    date.setDate(date.getDate() - (dayOffsetMatch[1] === "昨天" ? 1 : 2));
    date.setHours(
      Number(dayOffsetMatch[2]),
      Number(dayOffsetMatch[3]),
      Number(dayOffsetMatch[4] ?? 0),
      0,
    );
    return date.getTime();
  }

  const yearMatch =
    /(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(
      text,
    );
  if (yearMatch) {
    return new Date(
      Number(yearMatch[1]),
      Number(yearMatch[2]) - 1,
      Number(yearMatch[3]),
      Number(yearMatch[4] ?? 0),
      Number(yearMatch[5] ?? 0),
      Number(yearMatch[6] ?? 0),
      0,
    ).getTime();
  }

  const monthMatch =
    /(\d{1,2})[-/.月](\d{1,2})日?(?:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(
      text,
    );
  if (monthMatch) {
    const date = new Date();
    date.setMonth(Number(monthMatch[1]) - 1, Number(monthMatch[2]));
    date.setHours(
      Number(monthMatch[3] ?? 0),
      Number(monthMatch[4] ?? 0),
      Number(monthMatch[5] ?? 0),
      0,
    );
    return date.getTime();
  }

  return parseChinaTime(text);
};

const extractJsonAssignment = (html: string, name: string) => {
  const start = html.indexOf(name);
  if (start < 0) return undefined;

  const jsonStart = html.indexOf("{", start);
  if (jsonStart < 0) return undefined;

  let depth = 0;
  let insideString = false;
  let escaping = false;

  for (let index = jsonStart; index < html.length; index += 1) {
    const char = html[index];

    if (insideString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        insideString = false;
      }
      continue;
    }

    if (char === '"') {
      insideString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(jsonStart, index + 1);
    }
  }

  return undefined;
};

const formatCompactNumber = (value: number) => {
  if (value >= 10_000) return `${Math.floor(value / 10_000)}w+`;
  return String(value);
};

const formatDatePart = (value: number) => String(value).padStart(2, "0");

const formatYmd = (date = new Date()) =>
  `${date.getFullYear()}-${formatDatePart(date.getMonth() + 1)}-${formatDatePart(date.getDate())}`;

const parseRssItems = (xml: string, sourceHome: string) => {
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return normalizeItems(
    itemBlocks.map((block) => {
      const rawTitle =
        /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(block)?.[1] ??
        /<title>([\s\S]*?)<\/title>/i.exec(block)?.[1] ??
        "";
      const rawLink =
        /<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i.exec(block)?.[1] ??
        /<link>([\s\S]*?)<\/link>/i.exec(block)?.[1] ??
        "";
      const rawDescription =
        /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i.exec(
          block,
        )?.[1] ??
        /<description>([\s\S]*?)<\/description>/i.exec(block)?.[1] ??
        "";
      const pubDate =
        /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(block)?.[1]?.trim() ?? "";
      const url = toAbsoluteUrl(sourceHome, stripTags(rawLink)) ?? sourceHome;

      return {
        id: url,
        title: stripTags(rawTitle),
        url,
        pubDate: pubDate ? Date.parse(pubDate) : undefined,
        extra: {
          hover: stripTags(rawDescription),
        },
      };
    }),
  );
};

type ZhihuResponse = {
  data: Array<{
    target: {
      title_area?: { text?: string };
      excerpt_area?: { text?: string };
      metrics_area?: { text?: string };
      link?: { url?: string };
    };
  }>;
};

const getZhihu = async () => {
  const data = await fetchJson<ZhihuResponse>(
    "https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=30&desktop=true",
    {
      headers: {
        Referer: "https://www.zhihu.com/hot",
      },
    },
  );

  return normalizeItems(
    data.data.map((item) => {
      const url = item.target.link?.url ?? "https://www.zhihu.com/hot";

      return {
        id: /(\d+)(?:\D*)$/.exec(url)?.[1] ?? url,
        title: item.target.title_area?.text ?? "",
        url,
        extra: {
          hover: item.target.excerpt_area?.text,
          info: item.target.metrics_area?.text,
        },
      };
    }),
  );
};

type JuejinResponse = {
  data: Array<{
    content?: {
      content_id?: string;
      title?: string;
    };
  }>;
};

const getJuejin = async () => {
  const data = await fetchJson<JuejinResponse>(
    "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0",
    {
      headers: {
        Referer: "https://juejin.cn",
      },
    },
  );

  return normalizeItems(
    data.data.map((item) => {
      const id = item.content?.content_id ?? "";

      return {
        id,
        title: item.content?.title ?? "",
        url: `https://juejin.cn/post/${id}`,
      };
    }),
  );
};

type SspaiResponse = {
  data: Array<{
    id: number;
    title: string;
    summary?: string;
  }>;
};

const getSspai = async () => {
  const timestamp = Date.now();
  const data = await fetchJson<SspaiResponse>(
    `https://sspai.com/api/v1/article/tag/page/get?limit=30&offset=0&created_at=${timestamp}&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0&released=false`,
    {
      headers: {
        Referer: "https://sspai.com",
      },
    },
  );

  return normalizeItems(
    data.data.map((item) => ({
      id: String(item.id),
      title: item.title,
      url: `https://sspai.com/post/${item.id}`,
      extra: {
        hover: item.summary,
      },
    })),
  );
};

type V2exFeed = {
  items: Array<{
    id: string;
    title: string;
    url: string;
    date_modified?: string;
    date_published?: string;
  }>;
};

const getV2ex = async () => {
  const feeds = await Promise.all(
    ["create", "ideas", "programmer", "share"].map((node) =>
      fetchJson<V2exFeed>(`https://www.v2ex.com/feed/${node}.json`),
    ),
  );

  return normalizeItems(
    feeds
      .flatMap((feed) => feed.items)
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        pubDate: item.date_modified ?? item.date_published,
        extra: {
          date: item.date_modified ?? item.date_published,
        },
      }))
      .sort((a, b) => {
        const first = Date.parse(String(a.pubDate ?? 0));
        const second = Date.parse(String(b.pubDate ?? 0));
        return second - first;
      }),
  );
};

type HackerNewsItem = {
  id: number;
  title?: string;
  score?: number;
  descendants?: number;
  url?: string;
};

const getHackerNews = async () => {
  const ids = await fetchJson<number[]>(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  );
  const items = await Promise.all(
    ids
      .slice(0, 30)
      .map((id) =>
        fetchJson<HackerNewsItem>(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        ),
      ),
  );

  return normalizeItems(
    items.map((item) => ({
      id: String(item.id),
      title: item.title ?? "",
      url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
      extra: {
        info: `${item.score ?? 0} pts · ${item.descendants ?? 0} comments`,
        hover: `HN discussion: https://news.ycombinator.com/item?id=${item.id}`,
      },
    })),
  );
};

const getIthome = async () => {
  const xml = await fetchText("https://www.ithome.com/rss/");
  return parseRssItems(xml, "https://www.ithome.com");
};

type WeiboHotResponse = {
  data?: {
    realtime?: Array<{
      word?: string;
      word_scheme?: string;
      note?: string;
      num?: number;
      flag_desc?: string;
    }>;
  };
};

const getWeiboFromApi = async () => {
  const data = await fetchJson<WeiboHotResponse>(
    "https://weibo.com/ajax/side/hotSearch",
    {
      headers: {
        Referer: "https://weibo.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.realtime ?? []).map((item) => {
      const title = item.word_scheme ?? item.note ?? item.word ?? "";
      const keyword = item.word ?? title;

      return {
        id: keyword,
        title,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`,
        extra: {
          info: item.num ? `${item.num}` : item.flag_desc,
          badges: createBadges(item.flag_desc),
        },
      };
    }),
  );
};

const getWeiboFromHtml = async () => {
  const html = await fetchText(
    "https://s.weibo.com/top/summary?cate=realtimehot",
    {
      headers: {
        Cookie:
          "SUB=_2AkMWIuNSf8NxqwJRmP8dy2rhaoV2ygrEieKgfhKJJRMxHRl-yT9jqk86tRB6PaLNvQZR6zYUcYVT1zSjoSreQHidcUq7",
        Referer: "https://s.weibo.com/top/summary?cate=realtimehot",
      },
    },
  );
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  return normalizeItems(
    rows.map((row) => {
      const linkMatch =
        /<td[^>]*class="td-02"[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(
          row,
        );
      const title = stripTags(linkMatch?.[2] ?? "");
      const href = linkMatch?.[1];
      const label = stripTags(
        /<td[^>]*class="td-03"[\s\S]*?>([\s\S]*?)<\/td>/i.exec(row)?.[1] ?? "",
      );

      return {
        id: title,
        title,
        url:
          toAbsoluteUrl("https://s.weibo.com", href) ??
          `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
        extra: {
          badges: createBadges(label),
        },
      };
    }),
  );
};

const getWeibo = async () => {
  try {
    return await getWeiboFromApi();
  } catch {
    return getWeiboFromHtml();
  }
};

type BaiduData = {
  data?: {
    cards?: Array<{
      content?: Array<{
        isTop?: boolean;
        word?: string;
        rawUrl?: string;
        desc?: string;
        hotScore?: string;
      }>;
    }>;
  };
};

const parseBaiduData = (html: string) => {
  const rawJson =
    /<!--s-data:([\s\S]*?)-->/.exec(html)?.[1] ??
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/.exec(html)?.[1];

  if (!rawJson) return [];

  try {
    const parsed = JSON.parse(rawJson) as BaiduData;
    return parsed.data?.cards?.[0]?.content ?? [];
  } catch {
    return [];
  }
};

const getBaidu = async () => {
  const html = await fetchText("https://top.baidu.com/board?tab=realtime");
  const fromData = parseBaiduData(html);

  if (fromData.length) {
    return normalizeItems(
      fromData
        .filter((item) => !item.isTop)
        .map((item) => ({
          id: item.rawUrl ?? item.word ?? "",
          title: item.word ?? "",
          url: item.rawUrl ?? "https://top.baidu.com/board?tab=realtime",
          extra: {
            hover: item.desc,
            info: item.hotScore,
          },
        })),
    );
  }

  const rawMatches = [
    ...html.matchAll(
      /"word":"((?:\\"|[^"])*)"[\s\S]{0,1200}?"rawUrl":"((?:\\"|[^"])*)"/g,
    ),
  ];

  return normalizeItems(
    rawMatches.map((match) => {
      const title = decodeJsonText(match[1] ?? "");
      const url = decodeJsonText(match[2] ?? "").replace(/\\\//g, "/");

      return {
        id: url,
        title,
        url,
      };
    }),
  );
};

type ToutiaoResponse = {
  data?: Array<{
    ClusterIdStr?: string;
    Title?: string;
    HotValue?: string;
    LabelUri?: {
      url?: string;
    };
  }>;
};

const getToutiao = async () => {
  const data = await fetchJson<ToutiaoResponse>(
    "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc",
    {
      headers: {
        Referer: "https://www.toutiao.com",
      },
    },
  );

  return normalizeItems(
    (data.data ?? []).map((item) => ({
      id: item.ClusterIdStr ?? item.Title ?? "",
      title: item.Title ?? "",
      url: item.ClusterIdStr
        ? `https://www.toutiao.com/trending/${item.ClusterIdStr}/`
        : "https://www.toutiao.com",
      extra: {
        info: item.HotValue,
        icon: item.LabelUri?.url,
        badges: createBadges(item.LabelUri?.url ? "热" : undefined),
      },
    })),
  );
};

type DouyinResponse = {
  data?: {
    word_list?: Array<{
      sentence_id?: string;
      word?: string;
      hot_value?: string;
    }>;
  };
};

const getDouyin = async () => {
  const loginResponse = await fetchWithTimeout("https://login.douyin.com/", {
    headers: {
      Referer: "https://www.douyin.com",
    },
  });
  const cookie = loginResponse.headers.get("set-cookie") ?? undefined;
  const data = await fetchJson<DouyinResponse>(
    "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1",
    {
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        Referer: "https://www.douyin.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.word_list ?? []).map((item) => ({
      id: item.sentence_id ?? item.word ?? "",
      title: item.word ?? "",
      url: item.sentence_id
        ? `https://www.douyin.com/hot/${item.sentence_id}`
        : "https://www.douyin.com/hot",
      extra: {
        info: item.hot_value,
      },
    })),
  );
};

type BilibiliHotSearchResponse = {
  list?: Array<{
    keyword?: string;
    show_name?: string;
    icon?: string;
    heat_score?: number;
  }>;
};

type BilibiliVideoResponse = {
  data?: {
    list?: Array<{
      bvid?: string;
      title?: string;
      pubdate?: number;
      desc?: string;
      pic?: string;
      owner?: {
        name?: string;
      };
      stat?: {
        view?: number;
        like?: number;
      };
    }>;
  };
};

const getBilibiliHotSearch = async () => {
  const data = await fetchJson<BilibiliHotSearchResponse>(
    "https://s.search.bilibili.com/main/hotword?limit=30",
    {
      headers: {
        Referer: "https://www.bilibili.com",
      },
    },
  );

  return normalizeItems(
    (data.list ?? []).map((item) => {
      const keyword = item.keyword ?? item.show_name ?? "";

      return {
        id: keyword,
        title: item.show_name ?? keyword,
        url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`,
        extra: {
          icon: item.icon,
          info: item.heat_score ? `${item.heat_score}` : undefined,
          badges: createBadges(item.icon ? "热" : undefined),
        },
      };
    }),
  );
};

const getBilibiliHotVideo = async () => {
  const data = await fetchJson<BilibiliVideoResponse>(
    "https://api.bilibili.com/x/web-interface/popular",
    {
      headers: {
        Referer: "https://www.bilibili.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.list ?? []).map((video) => ({
      id: video.bvid ?? video.title ?? "",
      title: video.title ?? "",
      url: video.bvid
        ? `https://www.bilibili.com/video/${video.bvid}`
        : "https://www.bilibili.com",
      pubDate: video.pubdate ? video.pubdate * 1000 : undefined,
      extra: {
        hover: video.desc,
        icon: video.pic,
        info:
          video.owner?.name && video.stat
            ? `${video.owner.name} · ${formatCompactNumber(video.stat.view ?? 0)}观看 · ${formatCompactNumber(video.stat.like ?? 0)}点赞`
            : undefined,
      },
    })),
  );
};

const getGithub = async () => {
  const html = await fetchText(
    "https://github.com/trending?spoken_language_code=",
    {
      headers: {
        Referer: "https://github.com/explore",
      },
    },
  );
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? [];

  return normalizeItems(
    articles.map((article) => {
      const href =
        /<h2[\s\S]*?<a[^>]*href="([^"]+)"/i.exec(article)?.[1] ??
        /<a[^>]*href="([^"]+)"[^>]*data-view-component/i.exec(article)?.[1];
      const title = stripTags(
        /<h2[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(article)?.[1] ?? "",
      ).replace(/\s*\/\s*/g, " / ");
      const description = stripTags(
        /<p[^>]*>([\s\S]*?)<\/p>/i.exec(article)?.[1] ?? "",
      );
      const stars = stripTags(
        /href="[^"]*\/stargazers"[^>]*>([\s\S]*?)<\/a>/i.exec(article)?.[1] ??
          "",
      ).replace(/\s+/g, "");
      const url = toAbsoluteUrl("https://github.com", href) ?? "";

      return {
        id: href ?? title,
        title,
        url,
        extra: {
          info: stars ? `Stars ${stars}` : undefined,
          hover: description,
        },
      };
    }),
  );
};

const get36kr = async () => {
  const html = await fetchText("https://www.36kr.com/newsflashes", {
    headers: {
      Referer: "https://www.36kr.com",
    },
  });
  const blocks =
    html.match(/<div[^>]*newsflash-item[\s\S]*?<\/div>\s*<\/div>/gi) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href =
        /<a[^>]*class="[^"]*item-title[^"]*"[^>]*href="([^"]+)"/i.exec(
          block,
        )?.[1];
      const title = stripTags(
        /<a[^>]*class="[^"]*item-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const date = stripTags(
        /<span[^>]*class="[^"]*time[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const url = toAbsoluteUrl("https://www.36kr.com", href) ?? "";

      return {
        id: href ?? title,
        title,
        url,
        extra: {
          date,
        },
      };
    }),
  );
};

type WallstreetLiveResponse = {
  data?: {
    items?: Array<{
      id?: number;
      title?: string;
      content_text?: string;
      content_short?: string;
      display_time?: number;
      uri?: string;
      type?: string;
    }>;
  };
};

type WallstreetNewsResponse = {
  data?: {
    items?: Array<{
      resource_type?: string;
      resource?: {
        id?: number;
        title?: string;
        content_short?: string;
        display_time?: number;
        uri?: string;
        type?: string;
      };
    }>;
  };
};

type WallstreetHotResponse = {
  data?: {
    day_items?: Array<{
      id?: number;
      title?: string;
      uri?: string;
    }>;
  };
};

const getWallstreetcnQuick = async () => {
  const data = await fetchJson<WallstreetLiveResponse>(
    "https://api-one.wallstcn.com/apiv1/content/lives?channel=global-channel&limit=30",
    {
      headers: {
        Referer: "https://wallstreetcn.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.items ?? []).map((item) => ({
      id: String(item.id ?? item.uri ?? ""),
      title: item.title ?? item.content_text ?? item.content_short ?? "",
      url: item.uri ?? "https://wallstreetcn.com/live",
      pubDate: item.display_time ? item.display_time * 1000 : undefined,
      extra: {
        date: item.display_time ? item.display_time * 1000 : undefined,
      },
    })),
  );
};

const getWallstreetcnNews = async () => {
  const data = await fetchJson<WallstreetNewsResponse>(
    "https://api-one.wallstcn.com/apiv1/content/information-flow?channel=global-channel&accept=article&limit=30",
    {
      headers: {
        Referer: "https://wallstreetcn.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.items ?? [])
      .filter(
        (item) =>
          item.resource_type !== "theme" &&
          item.resource_type !== "ad" &&
          item.resource?.type !== "live" &&
          item.resource?.uri,
      )
      .map(({ resource }) => ({
        id: String(resource?.id ?? resource?.uri ?? ""),
        title: resource?.title ?? resource?.content_short ?? "",
        url: resource?.uri ?? "https://wallstreetcn.com",
        pubDate: resource?.display_time
          ? resource.display_time * 1000
          : undefined,
        extra: {
          date: resource?.display_time
            ? resource.display_time * 1000
            : undefined,
        },
      })),
  );
};

const getWallstreetcnHot = async () => {
  const data = await fetchJson<WallstreetHotResponse>(
    "https://api-one.wallstcn.com/apiv1/content/articles/hot?period=all",
    {
      headers: {
        Referer: "https://wallstreetcn.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.day_items ?? []).map((item) => ({
      id: String(item.id ?? item.uri ?? ""),
      title: item.title ?? "",
      url: item.uri ?? "https://wallstreetcn.com",
    })),
  );
};

type Jin10Item = {
  id: string;
  time?: string;
  data?: {
    title?: string;
    content?: string;
  };
  important?: number;
  channel?: number[];
};

const getJin10 = async () => {
  const rawData = await fetchText(
    `https://www.jin10.com/flash_newest.js?t=${Date.now()}`,
    {
      headers: {
        Referer: "https://www.jin10.com",
      },
    },
  );
  const json = rawData.replace(/^var\s+newest\s*=\s*/, "").replace(/;*$/, "");
  const data = JSON.parse(json) as Jin10Item[];

  return normalizeItems(
    data
      .filter(
        (item) =>
          (item.data?.title ?? item.data?.content) &&
          !item.channel?.includes(5),
      )
      .map((item) => {
        const text = (item.data?.title ?? item.data?.content ?? "").replace(
          /<\/?b>/g,
          "",
        );
        const [, title, description] = /^【([^】]*)】(.*)$/.exec(text) ?? [];

        return {
          id: item.id,
          title: title ?? text,
          pubDate: parseChinaTime(item.time),
          url: `https://flash.jin10.com/detail/${item.id}`,
          extra: {
            hover: description,
            info: item.important ? "重要" : undefined,
            badges: createBadges(item.important ? "重要" : undefined),
          },
        };
      }),
  );
};

type ClsItem = {
  id?: number;
  title?: string;
  brief?: string;
  shareurl?: string;
  ctime?: number;
  is_ad?: number;
};

type ClsTelegraphResponse = {
  data?: {
    roll_data?: ClsItem[];
  };
};

type ClsDepthResponse = {
  data?: {
    depth_list?: ClsItem[];
  };
};

type ClsHotResponse = {
  data?: ClsItem[];
};

const getClsTelegraph = async () => {
  const url = appendQuery(
    "https://www.cls.cn/nodeapi/updateTelegraphList",
    Object.fromEntries(createClsSearchParams()),
  );
  const data = await fetchJson<ClsTelegraphResponse>(url, {
    headers: {
      Referer: "https://www.cls.cn",
    },
  });

  return normalizeItems(
    (data.data?.roll_data ?? [])
      .filter((item) => !item.is_ad)
      .map((item) => ({
        id: String(item.id ?? item.shareurl ?? ""),
        title: item.title ?? item.brief ?? "",
        mobileUrl: item.shareurl,
        pubDate: item.ctime ? item.ctime * 1000 : undefined,
        url: item.id
          ? `https://www.cls.cn/detail/${item.id}`
          : (item.shareurl ?? ""),
      })),
  );
};

const getClsDepth = async () => {
  const url = appendQuery(
    "https://www.cls.cn/v3/depth/home/assembled/1000",
    Object.fromEntries(createClsSearchParams()),
  );
  const data = await fetchJson<ClsDepthResponse>(url, {
    headers: {
      Referer: "https://www.cls.cn",
    },
  });

  return normalizeItems(
    [...(data.data?.depth_list ?? [])]
      .sort((first, second) => (second.ctime ?? 0) - (first.ctime ?? 0))
      .map((item) => ({
        id: String(item.id ?? item.shareurl ?? ""),
        title: item.title ?? item.brief ?? "",
        mobileUrl: item.shareurl,
        pubDate: item.ctime ? item.ctime * 1000 : undefined,
        url: item.id
          ? `https://www.cls.cn/detail/${item.id}`
          : (item.shareurl ?? ""),
      })),
  );
};

const getClsHot = async () => {
  const url = appendQuery(
    "https://www.cls.cn/v2/article/hot/list",
    Object.fromEntries(createClsSearchParams()),
  );
  const data = await fetchJson<ClsHotResponse>(url, {
    headers: {
      Referer: "https://www.cls.cn",
    },
  });

  return normalizeItems(
    (data.data ?? []).map((item) => ({
      id: String(item.id ?? item.shareurl ?? ""),
      title: item.title ?? item.brief ?? "",
      mobileUrl: item.shareurl,
      url: item.id
        ? `https://www.cls.cn/detail/${item.id}`
        : (item.shareurl ?? ""),
    })),
  );
};

const getSolidot = async () => {
  const xml = await fetchText("https://www.solidot.org/index.rss");
  return parseRssItems(xml, "https://www.solidot.org");
};

const getSteam = async () => {
  const html = await fetchText("https://store.steampowered.com/stats/");
  const rows = html.match(/<tr[^>]*player_count_row[\s\S]*?<\/tr>/gi) ?? [];

  return normalizeItems(
    rows.map((row) => {
      const href = /<a[^>]*class="[^"]*gameLink[^"]*"[^>]*href="([^"]+)"/i.exec(
        row,
      )?.[1];
      const title = stripTags(
        /<a[^>]*class="[^"]*gameLink[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
          row,
        )?.[1] ?? "",
      );
      const currentPlayers = stripTags(
        /<span[^>]*class="[^"]*currentServers[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(
          row,
        )?.[1] ?? "",
      );

      return {
        id: href ?? title,
        title,
        url: toAbsoluteUrl("https://store.steampowered.com", href) ?? "",
        pubDate: Date.now(),
        extra: {
          info: currentPlayers,
        },
      };
    }),
  );
};

const getZaobao = async () => {
  const html = await fetchDecodedText(
    "https://www.zaochenbao.com/realtime/",
    "gb2312",
  );
  const blocks =
    html.match(/<a[^>]*class="[^"]*item[^"]*"[\s\S]*?<\/a>/gi) ?? [];

  return normalizeItems(
    blocks
      .map((block) => {
        const href = /href="([^"]+)"/i.exec(block)?.[1];
        const title = stripTags(
          /<[^>]*class="[^"]*eps[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
            block,
          )?.[1] ?? "",
        );
        const date = stripTags(
          /<[^>]*class="[^"]*pdt10[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
            block,
          )?.[1] ?? "",
        ).replace(/-\s*/g, " ");
        const url = toAbsoluteUrl("https://www.zaochenbao.com", href) ?? "";

        return {
          id: href ?? title,
          title,
          url,
          pubDate: parseLooseDate(date),
          extra: {
            date: parseLooseDate(date),
          },
        };
      })
      .sort(
        (first, second) =>
          (Number(second.pubDate) || 0) - (Number(first.pubDate) || 0),
      ),
  );
};

type CoolapkResponse = {
  data?: Array<{
    id?: string;
    editor_title?: string;
    message?: string;
    url?: string;
    dateline?: number;
    targetRow?: {
      subTitle?: string;
    };
  }>;
};

const createCoolapkHeaders = () => {
  const sizes = [10, 6, 6, 6, 14];
  const deviceId = sizes
    .map((size) => Math.random().toString(36).substring(2, size))
    .join("-");
  const now = Math.round(Date.now() / 1000);
  const md5Now = createHashText("md5", String(now));
  const rawToken = `token://com.coolapk.market/c67ef5943784d09750dcfbb31020f0ab?${md5Now}$${deviceId}&com.coolapk.market`;
  const appToken = `${createHashText("md5", encodeBase64(rawToken))}${deviceId}0x${now.toString(16)}`;

  return {
    "X-Api-Version": "11",
    "X-App-Code": "2101202",
    "X-App-Id": "com.coolapk.market",
    "X-App-Token": appToken,
    "X-App-Version": "11.0",
    "X-Requested-With": "XMLHttpRequest",
    "X-Sdk-Int": "29",
    "X-Sdk-Locale": "zh-CN",
    "User-Agent":
      "Dalvik/2.1.0 (Linux; U; Android 10; Redmi K30 5G) +CoolMarket/11.0-2101202",
  };
};

const getCoolapk = async () => {
  const data = await fetchJson<CoolapkResponse>(
    "https://api.coolapk.com/v6/page/dataList?url=%2Ffeed%2FstatList%3FcacheExpires%3D300%26statType%3Dday%26sortField%3Ddetailnum%26title%3D%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&title=%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&subTitle=&page=1",
    {
      headers: createCoolapkHeaders(),
    },
  );

  return normalizeItems(
    (data.data ?? []).map((item) => {
      const fallbackTitle = stripTags(item.message ?? "").split("\n")[0] ?? "";
      const title = item.editor_title?.trim()
        ? item.editor_title
        : fallbackTitle;

      return {
        id: item.id ?? item.url ?? "",
        title,
        url: item.url
          ? `https://www.coolapk.com${item.url}`
          : "https://www.coolapk.com",
        pubDate: item.dateline ? item.dateline * 1000 : undefined,
        extra: {
          info: item.targetRow?.subTitle,
        },
      };
    }),
  );
};

type MktnewsResponse = {
  data?: Array<{
    id?: string;
    time?: string;
    important?: number;
    data?: {
      content?: string;
      title?: string;
    };
  }>;
};

const getMktnewsFlash = async () => {
  const data = await fetchJson<MktnewsResponse>(
    "https://api.mktnews.net/api/flash?type=0&limit=50",
  );

  return normalizeItems(
    (data.data ?? [])
      .sort(
        (first, second) =>
          (parseLooseDate(second.time) ?? 0) -
          (parseLooseDate(first.time) ?? 0),
      )
      .map((item) => {
        const content = item.data?.content ?? "";
        const title =
          item.data?.title ?? /^【([^】]*)】/.exec(content)?.[1] ?? content;

        return {
          id: item.id ?? title,
          title,
          pubDate: parseLooseDate(item.time),
          url: item.id
            ? `https://mktnews.net/flashDetail.html?id=${item.id}`
            : "https://mktnews.net",
          extra: {
            hover: content,
            info: item.important === 1 ? "Important" : undefined,
            badges: createBadges(
              item.important === 1 ? { label: "重要", tone: "hot" } : undefined,
            ),
          },
        };
      }),
  );
};

const get36krRenqi = async () => {
  const baseUrl = "https://36kr.com";
  const html = await fetchText(`${baseUrl}/hot-list/renqi/${formatYmd()}/1`, {
    headers: {
      Referer: "https://36kr.com",
    },
  });
  const blocks =
    html.match(
      /<div[^>]*class="[^"]*article-item-info[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi,
    ) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href =
        /<a[^>]*class="[^"]*article-item-title[^"]*"[^>]*href="([^"]+)"/i.exec(
          block,
        )?.[1] ?? "";
      const title = stripTags(
        /<a[^>]*class="[^"]*article-item-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const description = stripTags(
        /<a[^>]*class="[^"]*article-item-description[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const author = stripTags(
        /<[^>]*class="[^"]*kr-flow-bar-author[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const hot = stripTags(
        /<[^>]*class="[^"]*kr-flow-bar-hot[^"]*"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i.exec(
          block,
        )?.[1] ?? "",
      );

      return {
        id: href || title,
        title,
        url: toAbsoluteUrl(baseUrl, href) ?? "",
        extra: {
          hover: description,
          info: [author, hot].filter(Boolean).join(" | "),
        },
      };
    }),
  );
};

const getHupu = async () => {
  const html = await fetchText("https://bbs.hupu.com/topic-daily-hot");
  const matches = [
    ...html.matchAll(
      /<li class="bbs-sl-web-post-body">[\s\S]*?<a href="(\/[^"]+?\.html)"[^>]*class="p-title"[^>]*>([^<]+)<\/a>/g,
    ),
  ];

  return normalizeItems(
    matches.map((match) => ({
      id: match[1] ?? match[2] ?? "",
      title: stripTags(match[2] ?? ""),
      url: toAbsoluteUrl("https://bbs.hupu.com", match[1]) ?? "",
    })),
  );
};

type TiebaResponse = {
  data?: {
    bang_topic?: {
      topic_list?: Array<{
        topic_id?: string;
        topic_name?: string;
        topic_url?: string;
      }>;
    };
  };
};

const getTieba = async () => {
  const data = await fetchJson<TiebaResponse>(
    "https://tieba.baidu.com/hottopic/browse/topicList",
  );

  return normalizeItems(
    (data.data?.bang_topic?.topic_list ?? []).map((item) => ({
      id: item.topic_id ?? item.topic_name ?? "",
      title: item.topic_name ?? "",
      url:
        item.topic_url ?? "https://tieba.baidu.com/hottopic/browse/topicList",
    })),
  );
};

type ThepaperResponse = {
  data?: {
    hotNews?: Array<{
      contId?: string;
      name?: string;
      pubTimeLong?: string;
    }>;
  };
};

const getThepaper = async () => {
  const data = await fetchJson<ThepaperResponse>(
    "https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar",
  );

  return normalizeItems(
    (data.data?.hotNews ?? []).map((item) => ({
      id: item.contId ?? item.name ?? "",
      title: item.name ?? "",
      url: item.contId
        ? `https://www.thepaper.cn/newsDetail_forward_${item.contId}`
        : "https://www.thepaper.cn",
      mobileUrl: item.contId
        ? `https://m.thepaper.cn/newsDetail_forward_${item.contId}`
        : undefined,
      pubDate: parseLooseDate(item.pubTimeLong),
    })),
  );
};

const getSputniknewscn = async () => {
  const html = await fetchText("https://sputniknews.cn/services/widget/lenta/");
  const blocks =
    html.match(
      /<div[^>]*class="[^"]*lenta__item[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi,
    ) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href = /<a[^>]*href="([^"]+)"/i.exec(block)?.[1];
      const title = stripTags(
        /<[^>]*class="[^"]*lenta__item-text[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const unixtime =
        /data-unixtime="(\d+)"/i.exec(block)?.[1] ??
        /data-unixtime='(\d+)'/i.exec(block)?.[1];
      const date = unixtime ? Number(unixtime) * 1000 : undefined;

      return {
        id: href ?? title,
        title,
        url: toAbsoluteUrl("https://sputniknews.cn", href) ?? "",
        pubDate: date,
        extra: {
          date,
        },
      };
    }),
  );
};

type CankaoxiaoxiResponse = {
  list?: Array<{
    data?: {
      id?: string;
      title?: string;
      url?: string;
      publishTime?: string;
    };
  }>;
};

const getCankaoxiaoxi = async () => {
  const responses = await Promise.all(
    ["zhongguo", "guandian", "gj"].map((channel) =>
      fetchJson<CankaoxiaoxiResponse>(
        `https://china.cankaoxiaoxi.com/json/channel/${channel}/list.json`,
      ),
    ),
  );

  return normalizeItems(
    responses
      .flatMap((response) => response.list ?? [])
      .map(({ data }) => ({
        id: data?.id ?? data?.url ?? "",
        title: data?.title ?? "",
        url: data?.url ?? "https://www.cankaoxiaoxi.com",
        pubDate: parseLooseDate(data?.publishTime),
        extra: {
          date: parseLooseDate(data?.publishTime),
        },
      }))
      .sort(
        (first, second) =>
          (Number(second.pubDate) || 0) - (Number(first.pubDate) || 0),
      ),
  );
};

const getPcbetaWindows11 = async () => {
  const xml = await fetchText(
    "https://bbs.pcbeta.com/forum.php?mod=rss&fid=563&auth=0",
  );
  return parseRssItems(xml, "https://bbs.pcbeta.com");
};

type XueqiuResponse = {
  data?: {
    items?: Array<{
      ad?: number;
      code?: string;
      exchange?: string;
      name?: string;
      percent?: number;
    }>;
  };
};

const getXueqiuHotStock = async () => {
  const cookieResponse = await fetchWithTimeout("https://xueqiu.com/hq", {
    headers: {
      Referer: "https://xueqiu.com",
    },
  });
  const cookie = cookieResponse.headers.get("set-cookie") ?? "";
  const data = await fetchJson<XueqiuResponse>(
    "https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=30&_type=10&type=10",
    {
      headers: {
        Cookie: cookie,
        Referer: "https://xueqiu.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.items ?? [])
      .filter((item) => !item.ad)
      .map((item) => ({
        id: item.code ?? item.name ?? "",
        title: item.name ?? item.code ?? "",
        url: item.code
          ? `https://xueqiu.com/s/${item.code}`
          : "https://xueqiu.com",
        extra: {
          info:
            item.percent !== undefined
              ? `${item.percent}% ${item.exchange ?? ""}`.trim()
              : item.exchange,
        },
      })),
  );
};

const getGelonghui = async () => {
  const baseUrl = "https://www.gelonghui.com";
  const html = await fetchText(`${baseUrl}/news/`);
  const blocks =
    html.match(
      /<div[^>]*class="[^"]*article-content[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi,
    ) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href =
        /<div[^>]*class="[^"]*detail-right[^"]*"[\s\S]*?<a[^>]*href="([^"]+)"/i.exec(
          block,
        )?.[1] ?? "";
      const title = stripTags(
        /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(block)?.[1] ?? "",
      );
      const spans = [...block.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map(
        (match) => stripTags(match[1] ?? ""),
      );
      const date = parseLooseDate(spans.at(-1));

      return {
        id: href || title,
        title,
        url: toAbsoluteUrl(baseUrl, href) ?? "",
        pubDate: date,
        extra: {
          date,
          info: spans[0],
        },
      };
    }),
  );
};

const getFastbullExpress = async () => {
  const baseUrl = "https://www.fastbull.com";
  const html = await fetchText(`${baseUrl}/cn/express-news`);
  const blocks =
    html.match(
      /<[^>]*class="[^"]*news-list[^"]*"[\s\S]*?<\/[^>]+>\s*<\/[^>]+>/gi,
    ) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href =
        /<a[^>]*class="[^"]*title_name[^"]*"[^>]*href="([^"]+)"/i.exec(
          block,
        )?.[1] ?? "";
      const titleText = stripTags(
        /<a[^>]*class="[^"]*title_name[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const bracketTitle = /【(.+)】/.exec(titleText)?.[1];
      const date = /data-date="(\d+)"/i.exec(block)?.[1];

      return {
        id: href || titleText,
        title:
          bracketTitle && bracketTitle.length >= 4 ? bracketTitle : titleText,
        url: toAbsoluteUrl(baseUrl, href) ?? "",
        pubDate: date ? Number(date) : undefined,
      };
    }),
  );
};

const getFastbullNews = async () => {
  const baseUrl = "https://www.fastbull.com";
  const html = await fetchText(`${baseUrl}/cn/news`);
  const blocks =
    html.match(/<a[^>]*class="[^"]*trending_type[^"]*"[\s\S]*?<\/a>/gi) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href = /href="([^"]+)"/i.exec(block)?.[1] ?? "";
      const title = stripTags(
        /<[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const date = /data-date="(\d+)"/i.exec(block)?.[1];

      return {
        id: href || title,
        title,
        url: toAbsoluteUrl(baseUrl, href) ?? "",
        pubDate: date ? Number(date) : undefined,
      };
    }),
  );
};

type ProductHuntResponse = {
  data?: {
    posts?: {
      edges?: Array<{
        node?: {
          id?: string;
          name?: string;
          slug?: string;
          tagline?: string;
          url?: string;
          votesCount?: number;
        };
      }>;
    };
  };
};

const getProductHunt = async () => {
  const apiToken = process.env.PRODUCTHUNT_API_TOKEN;
  if (!apiToken) return [];

  const data = await fetchJson<ProductHuntResponse>(
    "https://api.producthunt.com/v2/api/graphql",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { posts(first: 30, order: VOTES) { edges { node { id name tagline votesCount url slug } } } }`,
      }),
    },
  );

  return normalizeItems(
    (data.data?.posts?.edges ?? []).map(({ node }) => ({
      id: node?.id ?? node?.slug ?? "",
      title: node?.name ?? "",
      url:
        node?.url ??
        (node?.slug ? `https://www.producthunt.com/posts/${node.slug}` : ""),
      extra: {
        hover: node?.tagline,
        info:
          node?.votesCount !== undefined ? `△ ${node.votesCount}` : undefined,
      },
    })),
  );
};

const getBilibiliRanking = async () => {
  const data = await fetchJson<BilibiliVideoResponse>(
    "https://api.bilibili.com/x/web-interface/ranking/v2",
    {
      headers: {
        Referer: "https://www.bilibili.com",
      },
    },
  );

  return normalizeItems(
    (data.data?.list ?? []).map((video) => ({
      id: video.bvid ?? video.title ?? "",
      title: video.title ?? "",
      url: video.bvid
        ? `https://www.bilibili.com/video/${video.bvid}`
        : "https://www.bilibili.com",
      pubDate: video.pubdate ? video.pubdate * 1000 : undefined,
      extra: {
        hover: video.desc,
        icon: video.pic,
        info:
          video.owner?.name && video.stat
            ? `${video.owner.name} · ${formatCompactNumber(video.stat.view ?? 0)}观看 · ${formatCompactNumber(video.stat.like ?? 0)}点赞`
            : undefined,
      },
    })),
  );
};

const getKuaishou = async () => {
  const html = await fetchText("https://www.kuaishou.com/?isHome=1");
  const rawJson = extractJsonAssignment(html, "window.__APOLLO_STATE__");
  if (!rawJson) return [];

  const data = JSON.parse(rawJson) as {
    defaultClient?: Record<string, Record<string, unknown>>;
  };
  const client = data.defaultClient ?? {};
  const root = client.ROOT_QUERY ?? {};
  const hotRankRef = root['visionHotRank({"page":"home"})'] as
    | { id?: string }
    | undefined;
  const hotRankData = hotRankRef?.id ? client[hotRankRef.id] : undefined;
  const items =
    (hotRankData?.items as Array<{ id?: string }> | undefined) ?? [];

  return normalizeItems(
    items.map((item) => {
      const hotItem = item.id ? client[item.id] : undefined;
      const title = typeof hotItem?.name === "string" ? hotItem.name : "";
      const tagType =
        typeof hotItem?.tagType === "string" ? hotItem.tagType : undefined;

      return {
        id: item.id ?? title,
        title,
        url: `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(title)}`,
        extra: {
          icon:
            typeof hotItem?.iconUrl === "string" ? hotItem.iconUrl : undefined,
          badges: createBadges(
            tagType && tagType !== "置顶" ? tagType : undefined,
          ),
        },
      };
    }),
  );
};

type KaopuItem = {
  description?: string;
  link?: string;
  pub_date?: string;
  publisher?: string;
  title?: string;
};

const getKaopu = async () => {
  const data = await fetchJson<KaopuItem[]>(
    "https://kaopustorage.blob.core.windows.net/news-prod/news_list_hans_0.json",
  );

  return normalizeItems(
    data
      .filter((item) => item.publisher !== "财新" && item.publisher !== "公视")
      .map((item) => ({
        id: item.link ?? item.title ?? "",
        title: item.title ?? "",
        url: item.link ?? "https://kaopu.cc",
        pubDate: item.pub_date,
        extra: {
          hover: item.description,
          info: item.publisher,
        },
      })),
  );
};

type NowcoderResponse = {
  data?: {
    result?: Array<{
      id?: string;
      title?: string;
      type?: number;
      uuid?: string;
    }>;
  };
};

const getNowcoder = async () => {
  const data = await fetchJson<NowcoderResponse>(
    `https://gw-c.nowcoder.com/api/sparta/hot-search/top-hot-pc?size=20&_=${Date.now()}&t=`,
  );

  return normalizeItems(
    (data.data?.result ?? []).map((item) => {
      const url =
        item.type === 74
          ? `https://www.nowcoder.com/feed/main/detail/${item.uuid}`
          : item.type === 0
            ? `https://www.nowcoder.com/discuss/${item.id}`
            : "https://www.nowcoder.com";

      return {
        id: item.uuid ?? item.id ?? item.title ?? "",
        title: item.title ?? "",
        url,
      };
    }),
  );
};

type IfengData = {
  hotNews1?: Array<{
    newsTime?: string;
    title?: string;
    url?: string;
  }>;
};

const getIfeng = async () => {
  const html = await fetchText("https://www.ifeng.com/");
  const rawJson = extractJsonAssignment(html, "var allData");
  if (!rawJson) return [];

  const data = JSON.parse(rawJson) as IfengData;

  return normalizeItems(
    (data.hotNews1 ?? []).map((item) => ({
      id: item.url ?? item.title ?? "",
      title: item.title ?? "",
      url: item.url ?? "https://www.ifeng.com",
      pubDate: parseLooseDate(item.newsTime),
      extra: {
        date: parseLooseDate(item.newsTime),
      },
    })),
  );
};

const getChongbuluoLatest = async () => {
  const xml = await fetchText(
    "https://www.chongbuluo.com/forum.php?mod=rss&view=newthread",
  );
  return parseRssItems(xml, "https://www.chongbuluo.com");
};

const getChongbuluoHot = async () => {
  const baseUrl = "https://www.chongbuluo.com/";
  const html = await fetchText(`${baseUrl}forum.php?mod=guide&view=hot`);
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  return normalizeItems(
    rows.map((row) => {
      const href =
        /<[^>]*class="[^"]*common[^"]*"[\s\S]*?<a[^>]*href="([^"]+)"/i.exec(
          row,
        )?.[1] ?? "";
      const title = stripTags(
        /<[^>]*class="[^"]*xst[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
          row,
        )?.[1] ?? "",
      );

      return {
        id: href || title,
        title,
        url: toAbsoluteUrl(baseUrl, href) ?? "",
        extra: {
          hover: title,
        },
      };
    }),
  );
};

type DoubanResponse = {
  items?: Array<{
    card_subtitle?: string;
    id?: string;
    is_new?: boolean;
    title?: string;
  }>;
};

const getDouban = async () => {
  const data = await fetchJson<DoubanResponse>(
    "https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie",
    {
      headers: {
        Accept: "application/json, text/plain, */*",
        Referer: "https://movie.douban.com/",
      },
    },
  );

  return normalizeItems(
    (data.items ?? []).map((movie) => ({
      id: movie.id ?? movie.title ?? "",
      title: movie.title ?? "",
      url: movie.id
        ? `https://movie.douban.com/subject/${movie.id}`
        : "https://movie.douban.com",
      extra: {
        hover: movie.card_subtitle,
        info: movie.card_subtitle?.split(" / ").slice(0, 3).join(" / "),
        badges: createBadges(
          movie.is_new ? { label: "新", tone: "new" } : undefined,
        ),
      },
    })),
  );
};

type TencentHotResponse = {
  data?: {
    tabs?: Array<{
      articleList?: Array<{
        desc?: string;
        id?: string;
        link_info?: {
          url?: string;
        };
        media_name?: string;
        publish_time?: string;
        title?: string;
      }>;
    }>;
  };
};

const getTencentHot = async () => {
  const data = await fetchJson<TencentHotResponse>(
    "https://i.news.qq.com/web_backend/v2/getTagInfo?tagId=aEWqxLtdgmQ%3D",
    {
      headers: {
        Referer: "https://news.qq.com/",
      },
    },
  );

  return normalizeItems(
    (data.data?.tabs?.[0]?.articleList ?? []).map((item) => ({
      id: item.id ?? item.link_info?.url ?? item.title ?? "",
      title: item.title ?? "",
      url: item.link_info?.url ?? "https://news.qq.com",
      pubDate: parseLooseDate(item.publish_time),
      extra: {
        hover: item.desc,
        info: item.media_name,
      },
    })),
  );
};

const getFreebuf = async () => {
  const baseUrl = "https://www.freebuf.com";
  const html = await fetchText(baseUrl, {
    headers: {
      Referer: baseUrl,
    },
  });
  const blocks =
    html.match(
      /<div[^>]*class="[^"]*article-item[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi,
    ) ?? [];

  return normalizeItems(
    blocks.map((block) => {
      const href =
        /<[^>]*class="[^"]*title-left[^"]*"[\s\S]*?<a[^>]*href="([^"]+)"/i.exec(
          block,
        )?.[1] ?? "";
      const title = stripTags(
        /<[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const description = stripTags(
        /<[^>]*class="[^"]*text-line-2[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i.exec(
          block,
        )?.[1] ?? "",
      );
      const url = toAbsoluteUrl(baseUrl, href) ?? "";

      return {
        id: /\d+/.exec(url)?.[0] ?? url,
        title,
        url,
        extra: {
          hover: description,
        },
      };
    }),
  );
};

type QqVideoResponse = {
  data?: {
    card?: {
      children_list?: {
        list?: {
          cards?: Array<{
            id?: string;
            params?: {
              publish_date?: string;
              rec_subtitle?: string;
              sub_title?: string;
              title?: string;
              topic_label?: string;
            };
          }>;
        };
      };
    };
  };
};

const getQqVideoHotSearch = async () => {
  const data = await fetchJson<QqVideoResponse>(
    "https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getCard?video_appid=3000010&vversion_platform=2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://v.qq.com/",
      },
      body: JSON.stringify({
        page_params: {
          rank_channel_id: "100113",
          rank_name: "HotSearch",
          rank_page_size: "30",
          tab_name: "热搜榜",
          tab_type: "hot_rank",
          page_id: "scms_shake",
          page_type: "scms_shake",
          new_mark_label_enabled: "1",
        },
        page_context: {
          page_index: "1",
        },
        flip_info: {
          page_module_id: "792ac_19e77",
          sub_module_id: "20251106065177",
          flip_params: {
            source_key: "100113",
            page_num: "0",
          },
        },
      }),
    },
  );

  return normalizeItems(
    (data.data?.card?.children_list?.list?.cards ?? []).map((item) => ({
      id: item.id ?? item.params?.title ?? "",
      title: item.params?.title ?? "",
      url: item.id
        ? `https://v.qq.com/x/cover/${item.id}.html`
        : "https://v.qq.com",
      pubDate: parseLooseDate(item.params?.publish_date),
      extra: {
        hover: item.params?.sub_title ?? item.params?.rec_subtitle,
        badges: createBadges(item.params?.topic_label),
      },
    })),
  );
};

type IqiyiResponse = {
  items?: Array<{
    video?: Array<{
      data?: Array<{
        desc?: string;
        description?: string;
        display_name?: string;
        entity_id?: number;
        page_url?: string;
        showDate?: string;
        tag?: string;
        title?: string;
      }>;
    }>;
  }>;
};

const getIqiyiHotRanklist = async () => {
  const data = await fetchJson<IqiyiResponse>(
    "https://mesh.if.iqiyi.com/portal/lw/v7/channel/card/videoTab?channelName=recommend&data_source=v7_rec_sec_hot_rank_list&tempId=85&count=30&block_id=hot_ranklist&device=14a4b5ba98e790dce6dc07482447cf48&from=webapp",
    {
      headers: {
        Referer: "https://www.iqiyi.com",
      },
    },
  );

  return normalizeItems(
    (data.items?.[0]?.video?.[0]?.data ?? []).map((item) => ({
      id: String(item.entity_id ?? item.page_url ?? item.title ?? ""),
      title: item.title ?? item.display_name ?? "",
      url: item.page_url ?? "https://www.iqiyi.com",
      pubDate: parseLooseDate(item.showDate),
      extra: {
        hover: item.description,
        info: item.desc,
        badges: createBadges(item.tag),
      },
    })),
  );
};

export const newsFetchers: Record<string, () => Promise<NewsItem[]>> = {
  "36kr": get36kr,
  "36kr-quick": get36kr,
  "36kr-renqi": get36krRenqi,
  baidu: getBaidu,
  "bilibili-hot-search": getBilibiliHotSearch,
  "bilibili-hot-video": getBilibiliHotVideo,
  "bilibili-ranking": getBilibiliRanking,
  cankaoxiaoxi: getCankaoxiaoxi,
  "chongbuluo-hot": getChongbuluoHot,
  "chongbuluo-latest": getChongbuluoLatest,
  "cls-depth": getClsDepth,
  "cls-hot": getClsHot,
  "cls-telegraph": getClsTelegraph,
  coolapk: getCoolapk,
  douban: getDouban,
  douyin: getDouyin,
  "fastbull-express": getFastbullExpress,
  "fastbull-news": getFastbullNews,
  freebuf: getFreebuf,
  gelonghui: getGelonghui,
  github: getGithub,
  hackernews: getHackerNews,
  hupu: getHupu,
  ifeng: getIfeng,
  "iqiyi-hot-ranklist": getIqiyiHotRanklist,
  ithome: getIthome,
  juejin: getJuejin,
  jin10: getJin10,
  kaopu: getKaopu,
  kuaishou: getKuaishou,
  "mktnews-flash": getMktnewsFlash,
  nowcoder: getNowcoder,
  "pcbeta-windows11": getPcbetaWindows11,
  producthunt: getProductHunt,
  "qqvideo-tv-hotsearch": getQqVideoHotSearch,
  solidot: getSolidot,
  sspai: getSspai,
  sputniknewscn: getSputniknewscn,
  steam: getSteam,
  "tencent-hot": getTencentHot,
  thepaper: getThepaper,
  tieba: getTieba,
  toutiao: getToutiao,
  v2ex: getV2ex,
  "wallstreetcn-hot": getWallstreetcnHot,
  "wallstreetcn-news": getWallstreetcnNews,
  "wallstreetcn-quick": getWallstreetcnQuick,
  weibo: getWeibo,
  "xueqiu-hotstock": getXueqiuHotStock,
  zhihu: getZhihu,
  zaobao: getZaobao,
};

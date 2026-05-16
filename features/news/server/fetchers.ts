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

      return {
        id: title,
        title,
        url:
          toAbsoluteUrl("https://s.weibo.com", href) ??
          `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
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

export const newsFetchers: Record<string, () => Promise<NewsItem[]>> = {
  "36kr": get36kr,
  baidu: getBaidu,
  github: getGithub,
  hackernews: getHackerNews,
  ithome: getIthome,
  juejin: getJuejin,
  sspai: getSspai,
  v2ex: getV2ex,
  weibo: getWeibo,
  zhihu: getZhihu,
};

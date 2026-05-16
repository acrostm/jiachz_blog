import type { NewsColumn, NewsSource } from "../types";

const Time = {
  Realtime: 2 * 60 * 1000,
  Fast: 5 * 60 * 1000,
  Default: 10 * 60 * 1000,
  Common: 30 * 60 * 1000,
} as const;

export const newsColumns = [
  {
    id: "china",
    name: "中文热榜",
    description: "国内平台、问答社区和实时热搜。",
  },
  {
    id: "tech",
    name: "技术雷达",
    description: "开发者社区、科技媒体和开源趋势。",
  },
  {
    id: "world",
    name: "国际视野",
    description: "全球信息源和海外技术社区。",
  },
  {
    id: "finance",
    name: "商业快讯",
    description: "公司动态、融资和市场信号。",
  },
] satisfies NewsColumn[];

export const newsSources = [
  {
    id: "weibo",
    name: "微博",
    title: "实时热搜",
    type: "hottest",
    column: "china",
    color: "red",
    home: "https://weibo.com",
    intervalMs: Time.Realtime,
  },
  {
    id: "zhihu",
    name: "知乎",
    title: "热榜",
    type: "hottest",
    column: "china",
    color: "blue",
    home: "https://www.zhihu.com",
    intervalMs: Time.Default,
  },
  {
    id: "baidu",
    name: "百度热搜",
    title: "热搜榜",
    type: "hottest",
    column: "china",
    color: "blue",
    home: "https://top.baidu.com",
    intervalMs: Time.Default,
  },
  {
    id: "ithome",
    name: "IT之家",
    title: "最新",
    type: "realtime",
    column: "tech",
    color: "red",
    home: "https://www.ithome.com",
    intervalMs: Time.Fast,
  },
  {
    id: "36kr",
    name: "36氪",
    title: "快讯",
    type: "realtime",
    column: "finance",
    color: "blue",
    home: "https://36kr.com",
    intervalMs: Time.Fast,
  },
  {
    id: "v2ex",
    name: "V2EX",
    title: "最新分享",
    type: "realtime",
    column: "tech",
    color: "slate",
    home: "https://v2ex.com",
    intervalMs: Time.Common,
  },
  {
    id: "juejin",
    name: "稀土掘金",
    title: "热门文章",
    type: "hottest",
    column: "tech",
    color: "blue",
    home: "https://juejin.cn",
    intervalMs: Time.Common,
  },
  {
    id: "sspai",
    name: "少数派",
    title: "热门文章",
    type: "hottest",
    column: "tech",
    color: "red",
    home: "https://sspai.com",
    intervalMs: Time.Common,
  },
  {
    id: "hackernews",
    name: "Hacker News",
    title: "Top Stories",
    type: "hottest",
    column: "world",
    color: "orange",
    home: "https://news.ycombinator.com",
    intervalMs: Time.Common,
  },
  {
    id: "github",
    name: "GitHub",
    title: "Trending",
    type: "hottest",
    column: "tech",
    color: "gray",
    home: "https://github.com/trending",
    intervalMs: Time.Common,
  },
] satisfies NewsSource[];

export const newsSourceIds = newsSources.map((source) => source.id);

export const newsSourceMap = new Map(
  newsSources.map((source) => [source.id, source]),
);

export const isNewsSourceId = (value: string): value is string => {
  return newsSourceMap.has(value);
};

export const getNewsDirectory = () => ({
  columns: newsColumns,
  sources: newsSources,
});

"use server";

import dayjs from "dayjs";

import {
  REDIS_BLOG_UNIQUE_VISITOR,
  REDIS_PAGE_VIEW,
  REDIS_PAGE_VIEW_TODAY,
  REDIS_UNIQUE_VISITOR,
  REDIS_UNIQUE_VISITOR_TODAY,
} from "@/constants";
import { redis } from "@/lib/redis";

export const recordPV = async () => {
  try {
    const todayKey = dayjs().format("YYYY-MM-DD");
    // incr handles initialization automatically (starts at 1)
    await Promise.all([
      redis.incr(`${REDIS_PAGE_VIEW_TODAY}:${todayKey}`),
      redis.incr(REDIS_PAGE_VIEW),
    ]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record PV:", error instanceof Error ? error.message : error);
  }
};

export const getSiteStatistics = async () => {
  try {
    const todayKey = dayjs().format("YYYY-MM-DD");

    // Fetch all statistics in parallel for better performance
    const [pv, uv, todayPV, todayUV] = await Promise.all([
      redis.get(REDIS_PAGE_VIEW),
      redis.scard(REDIS_UNIQUE_VISITOR),
      redis.get(`${REDIS_PAGE_VIEW_TODAY}:${todayKey}`),
      redis.scard(`${REDIS_UNIQUE_VISITOR_TODAY}:${todayKey}`),
    ]);

    return {
      pv: pv ? Number(pv) : 0,
      uv: uv || 0,
      todayUV: todayUV || 0,
      todayPV: todayPV ? Number(todayPV) : 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch site statistics from Redis:", error instanceof Error ? error.message : error);
    return { pv: 0, uv: 0, todayUV: 0, todayPV: 0 };
  }
};

export const recordUV = async (cid?: string) => {
  if (!cid) {
    return;
  }

  try {
    const todayKey = dayjs().format("YYYY-MM-DD");
    await Promise.all([
      redis.sadd(`${REDIS_UNIQUE_VISITOR_TODAY}:${todayKey}`, cid),
      redis.sadd(REDIS_UNIQUE_VISITOR, cid),
    ]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record UV:", error instanceof Error ? error.message : error);
  }
};

export const recordBlogUV = async (blogID?: string, cid?: string) => {
  if (!blogID || !cid) {
    return;
  }

  try {
    await redis.sadd(`${REDIS_BLOG_UNIQUE_VISITOR}:${blogID}`, cid);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record Blog UV:", error instanceof Error ? error.message : error);
  }
};

export const getBlogUV = async (blogID: string) => {
  try {
    const uv = await redis.scard(`${REDIS_BLOG_UNIQUE_VISITOR}:${blogID}`);
    return uv || 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch Blog UV from Redis:", error instanceof Error ? error.message : error);
    return 0;
  }
};

export const getBlogsUV = async (blogIDs: string[]) => {
  try {
    const uvs = await Promise.all(
      blogIDs.map((el) => redis.scard(`${REDIS_BLOG_UNIQUE_VISITOR}:${el}`)),
    );
    return uvs.map((uv) => uv || 0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch Blogs UV from Redis:", error instanceof Error ? error.message : error);
    return blogIDs.map(() => 0);
  }
};

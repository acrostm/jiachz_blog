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
    await redis.incr(`${REDIS_PAGE_VIEW_TODAY}:${todayKey}`);

    const pv = await redis.get(REDIS_PAGE_VIEW);

    if (pv) {
      await redis.incr(REDIS_PAGE_VIEW);
    } else {
      await redis.set(REDIS_PAGE_VIEW, 1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record PV:", error);
  }
};

export const getSiteStatistics = async () => {
  try {
    // 总
    const pv = await redis.get(REDIS_PAGE_VIEW);
    const uv = await redis.scard(REDIS_UNIQUE_VISITOR);

    // 今日
    const todayKey = dayjs().format("YYYY-MM-DD");
    const todayPV = await redis.get(`${REDIS_PAGE_VIEW_TODAY}:${todayKey}`);
    const todayUV = await redis.scard(
      `${REDIS_UNIQUE_VISITOR_TODAY}:${todayKey}`,
    );

    return {
      pv: pv ? Number(pv) : 0,
      uv: uv || 0,
      todayUV: todayUV || 0,
      todayPV: todayPV ? Number(todayPV) : 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch site statistics from Redis:", error);
    return { pv: 0, uv: 0, todayUV: 0, todayPV: 0 };
  }
};

export const recordUV = async (cid?: string) => {
  if (!cid) {
    return;
  }

  try {
    const todayKey = dayjs().format("YYYY-MM-DD");
    await redis.sadd(`${REDIS_UNIQUE_VISITOR_TODAY}:${todayKey}`, cid);
    await redis.sadd(REDIS_UNIQUE_VISITOR, cid);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record UV:", error);
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
    console.warn(`Failed to record blog UV for ${blogID}:`, error);
  }
};

export const getBlogUV = async (blogID?: string) => {
  if (!blogID) {
    return 0;
  }
  try {
    const uv = await redis.scard(`${REDIS_BLOG_UNIQUE_VISITOR}:${blogID}`);
    return uv || 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch blog UV for ${blogID}:`, error);
    return 0;
  }
};

export const batchGetBlogUV = async (blogIDs?: string[]) => {
  if (!blogIDs?.length) {
    return new Map<string, number>();
  }

  const m = new Map<string, number>();

  try {
    const uvs = await Promise.all(
      blogIDs.map((el) => redis.scard(`${REDIS_BLOG_UNIQUE_VISITOR}:${el}`)),
    );
    let idx = 0;
    for (const uv of uvs) {
      m.set(blogIDs[idx]!, uv || 0);
      idx++;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch batch blog UVs:", error);
    // Return empty counts as fallback
    for (const blogID of blogIDs) {
      m.set(blogID, 0);
    }
  }

  return m;
};

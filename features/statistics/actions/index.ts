"use server";

import { prisma } from "@/lib/prisma";

export const recordPV = async () => {
  try {
    await prisma.websiteStatistics.upsert({
      where: { id: "singleton" },
      update: { pv: { increment: 1 } },
      create: { id: "singleton", pv: 1, uv: 1 },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record PV:", error instanceof Error ? error.message : error);
  }
};

export const getSiteStatistics = async () => {
  try {
    const stats = await prisma.websiteStatistics.findUnique({
      where: { id: "singleton" },
    });

    return {
      pv: stats?.pv || 0,
      uv: stats?.uv || 0,
      // Since we simplified the schema to remove daily stats, we return 0 for these
      todayUV: 0,
      todayPV: 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch site statistics from DB:", error instanceof Error ? error.message : error);
    return { pv: 0, uv: 0, todayUV: 0, todayPV: 0 };
  }
};

export const recordUV = async (cid?: string) => {
  if (!cid) {
    return;
  }

  try {
    await prisma.websiteStatistics.upsert({
      where: { id: "singleton" },
      update: { uv: { increment: 1 } },
      create: { id: "singleton", pv: 1, uv: 1 },
    });
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
    await prisma.blog.update({
      where: { id: blogID },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to record Blog views:", error instanceof Error ? error.message : error);
  }
};

export const getBlogUV = async (blogID: string) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogID },
      select: { views: true },
    });
    return blog?.views || 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch Blog views from DB:", error instanceof Error ? error.message : error);
    return 0;
  }
};

export const getBlogsUV = async (blogIDs: string[]) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { id: { in: blogIDs } },
      select: { id: true, views: true },
    });
    
    // Maintain the same order as blogIDs
    const viewsMap = new Map(blogs.map(b => [b.id, b.views]));
    return blogIDs.map(id => viewsMap.get(id) || 0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch Blogs views from DB:", error instanceof Error ? error.message : error);
    return blogIDs.map(() => 0);
  }
};

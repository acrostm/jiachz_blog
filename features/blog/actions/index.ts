"use server";

import { type Prisma } from "@prisma/client";
import { isUndefined } from "lodash-es";

import { ERROR_NO_PERMISSION, PUBLISHED_MAP } from "@/constants";
import { getBlogsUV } from "@/features/statistics";
import { noPermission } from "@/features/user";
import { notifyNewBlogCreated } from "@/lib/notification";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserId,
  logBlogActivity,
} from "@/lib/utils/activity-logger-helper";
import { getSkip } from "@/utils";

import {
  type CreateBlogDTO,
  type GetBlogsDTO,
  type UpdateBlogDTO,
  createBlogSchema,
  getBlogsSchema,
  updateBlogSchema,
} from "../types";

export const isBlogExistByID = async (id: string): Promise<boolean> => {
  const isExist = await prisma.blog.findUnique({ where: { id } });

  return Boolean(isExist);
};

export const getBlogs = async (params: GetBlogsDTO) => {
  const result = await getBlogsSchema.safeParseAsync(params);

  if (!result.success) {
    throw new Error(result.error.format()._errors?.join(";") || "");
  }

  const cond: Prisma.BlogWhereInput = {
    OR: [
      ...(result.data.title?.trim()
        ? [{ title: { contains: result.data.title.trim() } }]
        : []),
      ...(result.data.slug?.trim()
        ? [{ slug: { contains: result.data.slug.trim() } }]
        : []),
      ...(result.data.tags?.length
        ? [{ tags: { some: { id: { in: result.data.tags } } } }]
        : []),
    ],
  };

  const published = await noPermission();
  if (published || !isUndefined(result.data.published)) {
    cond.published = PUBLISHED_MAP[result.data.published!] ?? published;
  }

  const sort: Prisma.BlogOrderByWithRelationInput | undefined =
    result.data.orderBy && result.data.order
      ? { [result.data.orderBy]: result.data.order }
      : undefined;

  if (!cond.OR?.length) {
    delete cond.OR;
  }

  const total = await prisma.blog.count({ where: cond });
  const blogs = await prisma.blog.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      body: true,
      published: true,
      cover: true,
      author: true,
      creatorIp: true,
      creatorLocation: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
    },
    orderBy: sort,
    where: cond,
    take: result.data.pageSize,
    skip: getSkip(result.data.pageIndex, result.data.pageSize),
  });

  return { blogs, total };
};

export const getPublishedBlogs = async () => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        body: true,
        published: true,
        cover: true,
        author: true,
        creatorIp: true,
        creatorLocation: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
      },
      where: {
        published: true,
      },
    });

    const count = await prisma.blog.count({
      where: {
        published: true,
      },
    });

    const total = count ?? 0;

    const m = await getBlogsUV(blogs?.map((el) => el.id) ?? []);
    const uvMap = new Map<string, number>();
    blogs?.forEach((blog, idx) => {
      uvMap.set(blog.id, m[idx] ?? 0);
    });

    return {
      blogs,
      total,
      uvMap: Object.fromEntries(uvMap),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch published blogs from DB:", error);
    return {
      blogs: [],
      total: 0,
      uvMap: undefined,
    };
  }
};

export const getBlogByID = async (id: string) => {
  const blog = await prisma.blog.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      body: true,
      published: true,
      cover: true,
      author: true,
      creatorIp: true,
      creatorLocation: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
    },
  });

  return { blog };
};

export const getPublishedBlogBySlug = async (slug: string) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug, published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        body: true,
        published: true,
        cover: true,
        author: true,
        creatorIp: true,
        creatorLocation: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
      },
    });

    return { blog };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch published blog by slug ${slug}:`, error);
    return { blog: null };
  }
};

export const deleteBlogByID = async (id: string) => {
  const userId = await getCurrentUserId();

  if (await noPermission()) {
    await logBlogActivity(
      userId,
      "BLOG_DELETE",
      "BLOCKED",
      id,
      undefined,
      undefined,
      "权限不足",
    );
    throw ERROR_NO_PERMISSION;
  }

  const blog = await prisma.blog.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!blog) {
    await logBlogActivity(
      userId,
      "BLOG_DELETE",
      "FAILED",
      id,
      undefined,
      undefined,
      "Blog不存在",
    );
    throw new Error("Blog不存在");
  }

  try {
    await prisma.blog.delete({
      where: { id },
    });

    await logBlogActivity(userId, "BLOG_DELETE", "SUCCESS", id, blog.title);
  } catch (error) {
    await logBlogActivity(
      userId,
      "BLOG_DELETE",
      "FAILED",
      id,
      blog.title,
      undefined,
      "删除失败",
    );
    throw error;
  }
};

export const createBlog = async (params: CreateBlogDTO) => {
  const userId = await getCurrentUserId();

  if (await noPermission()) {
    await logBlogActivity(
      userId,
      "BLOG_CREATE",
      "BLOCKED",
      "",
      params.title,
      undefined,
      "权限不足",
    );
    return {
      success: false,
      error: "权限不足，仅管理员和已验证用户可以创建博客",
    };
  }

  const result = await createBlogSchema.safeParseAsync(params);

  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    await logBlogActivity(
      userId,
      "BLOG_CREATE",
      "FAILED",
      "",
      params.title,
      undefined,
      `验证失败: ${error}`,
    );
    return { success: false, error };
  }

  const { title, slug, description, body, published, cover, author, tags } =
    result.data;

  const blogs = await prisma.blog.findMany({
    where: {
      OR: [{ title }, { slug }],
    },
  });

  if (blogs.length) {
    await logBlogActivity(
      userId,
      "BLOG_CREATE",
      "FAILED",
      "",
      title,
      undefined,
      "标题或slug重复",
    );
    return { success: false, error: "标题或者slug重复" };
  }

  try {
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        description,
        body,
        published,
        cover,
        author,
        creatorIp: "127.0.0.1",
        creatorLocation: "本地环境",
        tags: tags
          ? {
              connect: tags.map((tagID) => ({ id: tagID })),
            }
          : undefined,
      },
    });

    // 记录活动日志
    await logBlogActivity(userId, "BLOG_CREATE", "SUCCESS", blog.id, title, {
      action: "create",
      newValue: {
        title,
        slug,
        published,
        author,
        tags: tags?.length ?? 0,
      },
    });

    // 如果是发布状态，也记录发布活动
    if (published) {
      await logBlogActivity(userId, "BLOG_PUBLISH", "SUCCESS", blog.id, title);
    }

    // Send notification for new blog creation
    const creationTime = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const status = published ? "已发布 ✅" : "草稿 📝";

    notifyNewBlogCreated(title, author ?? "未知", status, creationTime).catch(
      (error) => {
        // Silently handle notification errors
        void error;
      },
    );

    return { success: true };
  } catch {
    await logBlogActivity(
      userId,
      "BLOG_CREATE",
      "FAILED",
      "",
      title,
      undefined,
      "创建博客失败",
    );
    return { success: false, error: "创建博客失败，请重试" };
  }
};

export const toggleBlogPublished = async (id: string) => {
  const userId = await getCurrentUserId();

  if (await noPermission()) {
    await logBlogActivity(
      userId,
      "BLOG_PUBLISH",
      "BLOCKED",
      id,
      undefined,
      undefined,
      "权限不足",
    );
    throw ERROR_NO_PERMISSION;
  }

  const blog = await prisma.blog.findUnique({
    where: { id },
    select: { id: true, title: true, published: true },
  });

  if (!blog) {
    await logBlogActivity(
      userId,
      "BLOG_PUBLISH",
      "FAILED",
      id,
      undefined,
      undefined,
      "Blog不存在",
    );
    throw new Error("Blog不存在");
  }

  const newPublishedStatus = !blog.published;
  const activityType = newPublishedStatus ? "BLOG_PUBLISH" : "BLOG_UNPUBLISH";

  try {
    await prisma.blog.update({
      data: {
        published: newPublishedStatus,
      },
      where: {
        id,
      },
    });

    await logBlogActivity(userId, activityType, "SUCCESS", id, blog.title, {
      action: newPublishedStatus ? "publish" : "unpublish",
      previousValue: { published: blog.published },
      newValue: { published: newPublishedStatus },
    });
  } catch (error) {
    await logBlogActivity(
      userId,
      activityType,
      "FAILED",
      id,
      blog.title,
      undefined,
      "更新发布状态失败",
    );
    throw error;
  }
};

export const updateBlog = async (params: UpdateBlogDTO) => {
  const userId = await getCurrentUserId();

  if (await noPermission()) {
    await logBlogActivity(
      userId,
      "BLOG_UPDATE",
      "BLOCKED",
      params.id,
      undefined,
      undefined,
      "权限不足",
    );
    return {
      success: false,
      error: "权限不足，仅管理员和已验证用户可以编辑博客",
    };
  }

  const result = await updateBlogSchema.safeParseAsync(params);

  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    await logBlogActivity(
      userId,
      "BLOG_UPDATE",
      "FAILED",
      params.id,
      undefined,
      undefined,
      `验证失败: ${error}`,
    );
    return { success: false, error };
  }

  const { id, title, description, slug, cover, author, body, published, tags } =
    result.data;

  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!blog) {
    await logBlogActivity(
      userId,
      "BLOG_UPDATE",
      "FAILED",
      id,
      undefined,
      undefined,
      "Blog不存在",
    );
    return { success: false, error: "Blog不存在" };
  }

  try {
    const blogTags = new Set(blog.tags.map((el) => el.id));
    const tagsToConnect = tags
      ?.filter((tagID) => !blogTags.has(tagID))
      .map((tagID) => ({ id: tagID }));
    const tagsToDisconnect = Array.from(blogTags)
      .filter((tagID) => !tags?.includes(tagID))
      .map((tagID) => ({ id: tagID }));

    // 记录变更内容
    const changes: string[] = [];
    const previousValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};

    if (title && title !== blog.title) {
      changes.push("标题");
      previousValue.title = blog.title;
      newValue.title = title;
    }
    if (description && description !== blog.description) {
      changes.push("描述");
      previousValue.description = blog.description;
      newValue.description = description;
    }
    if (slug && slug !== blog.slug) {
      changes.push("链接");
      previousValue.slug = blog.slug;
      newValue.slug = slug;
    }
    if (published !== undefined && published !== blog.published) {
      changes.push("发布状态");
      previousValue.published = blog.published;
      newValue.published = published;
    }
    if (tagsToConnect?.length || tagsToDisconnect?.length) {
      changes.push("标签");
      previousValue.tags = blog.tags.map((t) => t.name);
    }

    await prisma.blog.update({
      where: { id },
      data: {
        title: title ?? blog.title,
        description: description ?? blog.description,
        slug: slug ?? blog.slug,
        cover: cover ?? blog.cover,
        author: author ?? blog.author,
        body: body ?? blog.body,
        published: published ?? blog.published,
        tags: {
          connect: tagsToConnect?.length ? tagsToConnect : undefined,
          disconnect: tagsToDisconnect?.length ? tagsToDisconnect : undefined,
        },
      },
    });

    // 记录更新活动
    await logBlogActivity(userId, "BLOG_UPDATE", "SUCCESS", id, blog.title, {
      action: "update",
      changes,
      previousValue,
      newValue,
    });

    // 如果发布状态发生变化，记录额外的发布/取消发布活动
    if (published !== undefined && published !== blog.published) {
      const publishActivityType = published ? "BLOG_PUBLISH" : "BLOG_UNPUBLISH";
      await logBlogActivity(
        userId,
        publishActivityType,
        "SUCCESS",
        id,
        blog.title,
      );
    }

    return { success: true };
  } catch {
    await logBlogActivity(
      userId,
      "BLOG_UPDATE",
      "FAILED",
      id,
      blog.title,
      undefined,
      "更新博客失败",
    );
    return { success: false, error: "更新博客失败，请重试" };
  }
};

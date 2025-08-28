import { type NextRequest, NextResponse } from "next/server";

import { type z } from "zod";

import { createBlogSchema } from "@/features/blog";
import { noPermission } from "@/features/user";
import { auth } from "@/lib/auth";
import { getIPLocation } from "@/lib/geolocation";
import { notifyNewBlogCreated } from "@/lib/notification";
import { prisma } from "@/lib/prisma";
import { logBlogActivity } from "@/lib/utils/activity-logger-helper";

export async function GET() {
  const posts = await prisma.blog.findMany({
    where: { published: true },
    include: { tags: true },
  });

  return new Response(JSON.stringify(posts));
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let blogTitle = "";
  let blogId = "";

  try {
    // 获取当前登录用户
    const session = await auth();
    userId = session?.user?.id ?? null;

    if (await noPermission()) {
      // 记录权限不足的失败日志
      await logBlogActivity(
        userId,
        "BLOG_CREATE",
        "FAILED",
        "",
        "",
        { reason: "权限检查" },
        "权限不足，仅管理员和已验证用户可以创建博客",
      );

      return NextResponse.json(
        { success: false, error: "权限不足，仅管理员和已验证用户可以创建博客" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as z.infer<typeof createBlogSchema>;
    const result = await createBlogSchema.safeParseAsync(body);

    if (!result.success) {
      const error = result.error.format()._errors?.join(";");

      // 记录数据验证失败的日志
      await logBlogActivity(
        userId,
        "BLOG_CREATE",
        "FAILED",
        "",
        body?.title ?? "",
        { reason: "数据验证", validationErrors: result.error.format() },
        `数据验证失败: ${error}`,
      );

      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const {
      title,
      slug,
      description,
      body: content,
      published,
      cover,
      author,
      tags,
    } = result.data;

    // 设置变量用于日志记录
    blogTitle = title;

    // Check for duplicate title or slug
    const existingBlogs = await prisma.blog.findMany({
      where: {
        OR: [{ title }, { slug }],
      },
    });

    if (existingBlogs.length) {
      // 记录重复检查失败的日志
      await logBlogActivity(
        userId,
        "BLOG_CREATE",
        "FAILED",
        "",
        title,
        {
          reason: "重复检查",
          duplicateFields: existingBlogs.map((blog) => ({
            id: blog.id,
            title: blog.title === title ? "标题重复" : null,
            slug: blog.slug === slug ? "Slug重复" : null,
          })),
        },
        "标题或者slug重复",
      );

      return NextResponse.json(
        { success: false, error: "标题或者slug重复" },
        { status: 400 },
      );
    }

    // Capture IP and get location
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "127.0.0.1";

    const location = await getIPLocation(clientIp);

    // Create blog with IP and location info
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        description,
        body: content,
        published,
        cover,
        author,
        creatorIp: clientIp || "127.0.0.1",
        creatorLocation: location || "本地环境",
        tags: tags
          ? {
              connect: tags.map((tagID) => ({ id: tagID })),
            }
          : undefined,
      },
    });

    // 设置博客ID用于日志记录
    blogId = blog.id;

    // 记录博客创建成功的日志
    await logBlogActivity(userId, "BLOG_CREATE", "SUCCESS", blog.id, title, {
      slug,
      published,
      author: author ?? "未知",
      hasDescription: !!description,
      hasCover: !!cover,
      tagCount: tags?.length ?? 0,
      bodyLength: content?.length ?? 0,
      creatorIp: clientIp,
      creatorLocation: location ?? "本地环境",
    });

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

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    // 记录异常失败的日志
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    await logBlogActivity(
      userId,
      "BLOG_CREATE",
      "FAILED",
      blogId ?? "",
      blogTitle ?? "",
      {
        reason: "系统异常",
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      `创建博客失败: ${errorMessage}`,
    );

    return NextResponse.json(
      { success: false, error: "创建博客失败，请重试" },
      { status: 500 },
    );
  }
}

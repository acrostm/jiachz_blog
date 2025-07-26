import { type NextRequest, NextResponse } from "next/server";

import { createBlogSchema } from "@/features/blog/types";
import { noPermission } from "@/features/user";
import { getIPLocation } from "@/lib/geolocation";
import { notifyNewBlogCreated } from "@/lib/notification";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.blog.findMany({
    where: { published: true },
    include: { tags: true },
  });

  return new Response(JSON.stringify(posts));
}

export async function POST(req: NextRequest) {
  try {
    if (await noPermission()) {
      return NextResponse.json(
        { success: false, error: "权限不足，仅管理员和已验证用户可以创建博客" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const result = await createBlogSchema.safeParseAsync(body);

    if (!result.success) {
      const error = result.error.format()._errors?.join(";");
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

    // Check for duplicate title or slug
    const existingBlogs = await prisma.blog.findMany({
      where: {
        OR: [{ title }, { slug }],
      },
    });

    if (existingBlogs.length) {
      return NextResponse.json(
        { success: false, error: "标题或者slug重复" },
        { status: 400 },
      );
    }

    // Capture IP and get location
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";

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
        creatorIp: clientIp,
        creatorLocation: location,
        tags: tags
          ? {
              connect: tags.map((tagID) => ({ id: tagID })),
            }
          : undefined,
      },
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
  } catch {
    return NextResponse.json(
      { success: false, error: "创建博客失败，请重试" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/utils";

// 获取客户端 IP
function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    return first ? first.trim() : "unknown";
  }
  // req.ip 可能 undefined，类型兼容
  return (
    (req as unknown as { ip?: string }).ip ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET() {
  try {
    // 查询所有留言，按时间倒序，带 user 信息
    const messages = await prisma?.messageBoard?.findMany?.({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    if (!messages) {
      return NextResponse.json({ error: "留言查询失败" }, { status: 500 });
    }
    // 联表查 user 信息
    const userIds = messages.filter((m) => m.userId).map((m) => m.userId!);
    let userMap: Record<
      string,
      { name?: string; image?: string; email?: string; emailVerified?: string }
    > = {};
    if (userIds.length > 0 && prisma?.user?.findMany) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          emailVerified: true,
        },
      });
      userMap = Object.fromEntries(
        users.map((u) => [
          u.id,
          {
            name: u.name ?? undefined,
            image: u.image ?? undefined,
            email: u.email ?? undefined,
            emailVerified: u.emailVerified?.toISOString() ?? undefined,
          },
        ]),
      );
    }
    return NextResponse.json({
      messages: messages.map((m) => ({
        ...m,
        userInfo: m.userId ? userMap[m.userId] : undefined,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "留言查询异常", detail: String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = (await req.json()) as { content?: string };
    const content = (body.content ?? "").trim();
    if (!content)
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    const isLogin = !!session?.user?.id;
    const userId = isLogin ? session.user!.id : undefined;
    if (!prisma?.messageBoard?.create) {
      return NextResponse.json(
        { error: "留言创建失败，数据库未连接" },
        { status: 500 },
      );
    }
    const message = await prisma.messageBoard.create({
      data: {
        content,
        ip,
        userAgent,
        isLogin,
        userId,
      },
    });
    let userInfo = undefined;
    if (userId && prisma?.user?.findUnique) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true, emailVerified: true },
      });
      if (user)
        userInfo = {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          emailVerified: user.emailVerified?.toISOString() ?? undefined,
        };
    }
    return NextResponse.json({
      message: { ...message, userInfo },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "留言创建异常", detail: String(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    if (!prisma?.messageBoard?.delete) {
      return NextResponse.json(
        { error: "留言删除失败，数据库未连接" },
        { status: 500 },
      );
    }
    await prisma.messageBoard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "留言删除异常", detail: String(e) },
      { status: 500 },
    );
  }
}

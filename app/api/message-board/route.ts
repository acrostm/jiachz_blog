import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/utils";

// 获取客户端 IP
function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  // req.ip 可能 undefined，类型兼容
  const ip =
    (req as unknown as { ip?: string }).ip ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return ip;
}

export async function GET() {
  // 查询所有留言，按时间倒序，带 user 信息
  const messages = await prisma.messageBoard.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  // 联表查 user 信息
  const userIds = messages.filter((m) => m.userId).map((m) => m.userId!);
  let userMap: Record<string, { name?: string; image?: string }> = {};
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, email: true },
    });
    userMap = Object.fromEntries(
      users.map((u) => [
        u.id,
        {
          name: u.name ?? undefined,
          image: u.image ?? undefined,
          email: u.email ?? undefined,
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
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const content = (body.content || "").trim();
  if (!content)
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const isLogin = !!session?.user?.id;
  const userId = isLogin ? session.user!.id : undefined;
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
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true },
    });
    if (user)
      userInfo = {
        name: user.name ?? undefined,
        image: user.image ?? undefined,
      };
  }
  return NextResponse.json({
    message: { ...message, userInfo },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  await prisma.messageBoard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

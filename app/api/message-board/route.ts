import { type NextRequest, NextResponse } from "next/server";

import { checkBotId } from "botid/server";

import { auth } from "@/lib/auth";
import { notifyNewMessage } from "@/lib/notification";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/utils";
import { logMessageActivity } from "@/lib/utils/activity-logger-helper";

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
    const { isBot, isVerifiedBot } = await checkBotId();
    if (isBot && !isVerifiedBot) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const session = await auth();
    const body = (await req.json()) as { content?: string };
    const content = (body.content ?? "").trim();
    if (!content)
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    const isLogin = !!session?.user?.id;
    const userId = isLogin ? session.user.id : undefined;
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

    // Send notification for new message
    const author = userInfo?.name ?? (isLogin ? "已登录用户" : "匿名用户");
    const currentTime = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    try {
      await notifyNewMessage(author, content, currentTime, ip);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send new message Bark notification:", error);
    }

    // 记录留言发送活动日志
    if (userId) {
      await logMessageActivity(userId, "MESSAGE_SEND", "SUCCESS", message.id, {
        messageLength: content.length,
        isLogin,
        ip,
        userAgent,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to log message activity:", error);
      });
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

    // 获取留言信息用于日志记录
    const messageToDelete = await prisma.messageBoard.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        userId: true,
        ip: true,
        createdAt: true,
      },
    });

    await prisma.messageBoard.delete({ where: { id } });

    // 记录留言删除活动日志
    if (session.user.id) {
      await logMessageActivity(
        session.user.id,
        "MESSAGE_DELETE",
        "SUCCESS",
        id,
        {
          deletedMessageInfo: messageToDelete
            ? {
                originalAuthorId: messageToDelete.userId,
                messageLength: messageToDelete.content?.length || 0,
                originalIp: messageToDelete.ip,
                originalCreatedAt: messageToDelete.createdAt?.toISOString(),
              }
            : undefined,
          adminAction: true,
        },
      ).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to log message activity:", error);
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    // 记录删除失败的日志
    if (req.headers.get("user-agent")) {
      const session = await auth().catch(() => null);
      if (session?.user?.id) {
        await logMessageActivity(
          session.user.id,
          "MESSAGE_DELETE",
          "FAILED",
          req.headers.get("x-message-id") ?? "unknown",
          {},
          String(e),
        ).catch((error) => {
          // eslint-disable-next-line no-console
          console.error("Failed to log message activity:", error);
        });
      }
    }

    return NextResponse.json(
      { error: "留言删除异常", detail: String(e) },
      { status: 500 },
    );
  }
}

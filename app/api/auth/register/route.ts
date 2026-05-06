import { type NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { checkBotId } from "botid/server";

import { activityLogger } from "@/lib/activity-logger";
import { notifyNewUserRegistered } from "@/lib/notification";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let email = "";
  let name = "";

  try {
    const { isBot, isVerifiedBot } = await checkBotId();
    if (isBot && !isVerifiedBot) {
      return NextResponse.json({ message: "Access Denied" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    email = typeof body.email === "string" ? body.email : "";
    name = typeof body.name === "string" ? body.name : "";
    const password = typeof body.password === "string" ? body.password : "";
    const image = typeof body.image === "string" ? body.image : undefined;

    if (!email || !name || !password) {
      return NextResponse.json({ message: "缺少必要字段" }, { status: 400 });
    }

    // 检查邮箱是否已注册
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      // 记录注册失败日志（邮箱已存在）
      await activityLogger.logAuthActivity(exist.id, "REGISTER", "FAILED", {
        email,
        name,
        reason: "邮箱已注册",
        existingUser: true,
      });
      return NextResponse.json({ message: "邮箱已注册" }, { status: 400 });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        image,
        createdAt: now,
        lastLoginAt: now,
      },
    });

    // 创建 account 记录
    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "credentials",
        providerAccountId: email,
        type: "credentials",
      },
    });

    // Send notification for new user registration
    const clientIp =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const registrationTime = now.toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    try {
      await notifyNewUserRegistered(name, email, registrationTime, clientIp);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send new user Bark notification:", error);
    }

    // 记录注册成功日志
    await activityLogger.logAuthActivity(user.id, "REGISTER", "SUCCESS", {
      email,
      name,
      hasAvatar: Boolean(image),
      provider: "credentials",
    });

    return NextResponse.json({ message: "注册成功" });
  } catch (error) {
    // 记录注册异常日志
    if (email && name) {
      await activityLogger.logActivity({
        userId: "unknown",
        activityType: "REGISTER",
        activityStatus: "FAILED",
        resourceType: "USER",
        errorMessage:
          error instanceof Error ? error.message : "注册过程中发生未知错误",
        metadata: {
          email,
          name,
          reason: "系统异常",
        },
      });
    }
    return NextResponse.json({ message: "注册失败" }, { status: 500 });
  }
}

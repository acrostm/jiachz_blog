import { type NextRequest, NextResponse } from "next/server";

import { activityLogger } from "@/lib/activity-logger";
import { prisma } from "@/lib/prisma";

interface LoginFailureData {
  email: string;
  errorType: string;
  loginMethod: "CREDENTIALS" | "OAUTH_GITHUB" | "OAUTH_GOOGLE";
}

export async function POST(req: NextRequest) {
  try {
    const { email, errorType, loginMethod } =
      (await req.json()) as LoginFailureData;

    // 尝试查找用户ID（如果邮箱存在）
    let userId = "unknown";
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }

    // 记录登录失败日志
    await activityLogger.trackLogin({
      userId,
      loginMethod,
      loginStatus: "FAILED",
      failureReason: errorType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to log failed login:", error);
    // 返回成功避免影响登录流程
    return NextResponse.json({ success: true });
  }
}

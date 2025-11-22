import { type NextRequest, NextResponse } from "next/server";

import { barkNotification } from "@/lib/notification";

/**
 * 测试bark通知功能
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      body?: string;
    };

    const title = body.title ?? "🧪 测试通知";
    const message =
      body.body ??
      `📱 这是一条测试通知\n\n🕒 测试时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}\n\n✅ 如果你收到这条通知，说明bark配置正常工作！`;

    const success = await barkNotification.sendQuickNotification(
      title,
      message,
      {
        sound: "bell.caf",
      },
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Test notification sent successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send test notification",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test notification",
      },
      { status: 500 },
    );
  }
}

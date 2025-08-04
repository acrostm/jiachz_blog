import { type NextRequest, NextResponse } from "next/server";

import { noPermission } from "@/features/user";
import { activityLogger } from "@/lib/activity-logger";

// 管理员获取可疑活动列表
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    if (await noPermission()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    // 获取可疑活动
    const suspiciousActivities =
      await activityLogger.getSuspiciousActivities(limit);

    // 格式化数据以兼容前端组件
    const formattedData = suspiciousActivities.map((activity) => ({
      id: activity.id,
      userId: activity.userId,
      userEmail: activity.user?.email ?? "",
      userName: activity.user?.name ?? "",
      loginAt: activity.timestamp, // 使用timestamp代替loginAt
      loginStatus: activity.activityStatus,
      loginMethod: activity.metadata
        ? ((JSON.parse(activity.metadata) as { loginMethod?: string })
            ?.loginMethod ?? "UNKNOWN")
        : "UNKNOWN",
      ipAddress: activity.ipAddress,
      location: activity.location ?? "",
      country: activity.country ?? "",
      region: activity.region ?? "",
      city: activity.city ?? "",
      browserName: activity.browserName ?? "",
      browserVersion: activity.browserVersion ?? "",
      operatingSystem: activity.operatingSystem ?? "",
      deviceType: activity.deviceType,
      isSuspicious: activity.isSuspicious,
      suspiciousReasons: activity.suspiciousReasons ?? "[]",
      riskScore: activity.riskScore,
      locationChanged: false, // 需要从UserActivityLog的逻辑中推算
      newDevice: false, // 需要从UserActivityLog的逻辑中推算
      previousLoginIp: "", // 这些字段在新系统中不再直接存储
      previousLoginLocation: "",
      timeSinceLastLogin: null,
      createdAt: activity.createdAt,
    }));

    return NextResponse.json({
      suspiciousLogins: formattedData, // 保持原有的字段名以兼容前端
      total: formattedData.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch suspicious activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch suspicious activities" },
      { status: 500 },
    );
  }
}

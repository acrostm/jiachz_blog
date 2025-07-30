import { NextRequest, NextResponse } from "next/server";

import { ActivityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ActivityStats } from "@/lib/types/activity-log";

// 管理员获取活动统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "7"); // 默认查询最近7天

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = userId ? { userId } : {};

    // 并行查询各种统计数据
    const [
      totalActivities,
      todayActivities,
      suspiciousActivities,
      failedActivities,
      activityTypeData,
      hourlyData,
    ] = await Promise.all([
      // 总活动数
      prisma.userActivityLog.count({ where }),

      // 今日活动数
      prisma.userActivityLog.count({
        where: {
          ...where,
          timestamp: { gte: today },
        },
      }),

      // 可疑活动数
      prisma.userActivityLog.count({
        where: {
          ...where,
          isSuspicious: true,
        },
      }),

      // 失败活动数
      prisma.userActivityLog.count({
        where: {
          ...where,
          activityStatus: "FAILED",
        },
      }),

      // 按活动类型统计
      prisma.userActivityLog.groupBy({
        by: ["activityType"],
        where: {
          ...where,
          timestamp: { gte: startDate },
        },
        _count: {
          activityType: true,
        },
      }),

      // 按小时统计最近24小时的活动
      prisma.$queryRaw<Array<{ hour: number; count: number }>>`
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*)::integer as count
        FROM "UserActivityLog"
        WHERE timestamp >= ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}
          ${userId ? prisma.$queryRaw`AND "userId" = ${userId}` : prisma.$queryRaw``}
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      `,
    ]);

    // 处理活动类型统计数据
    const activityTypeStats: Record<ActivityType, number> = {} as Record<
      ActivityType,
      number
    >;

    // 初始化所有活动类型为0
    const allActivityTypes: ActivityType[] = [
      "REGISTER",
      "LOGIN",
      "LOGOUT",
      "PASSWORD_CHANGE",
      "BLOG_CREATE",
      "BLOG_UPDATE",
      "BLOG_DELETE",
      "BLOG_PUBLISH",
      "BLOG_UNPUBLISH",
      "NOTE_CREATE",
      "NOTE_UPDATE",
      "NOTE_DELETE",
      "NOTE_PUBLISH",
      "NOTE_UNPUBLISH",
      "MESSAGE_SEND",
      "MESSAGE_DELETE",
      "TAG_CREATE",
      "TAG_UPDATE",
      "TAG_DELETE",
      "ADMIN_ACCESS",
      "USER_MANAGE",
      "SYSTEM_CONFIG",
      "FILE_UPLOAD",
      "FILE_DELETE",
    ];

    allActivityTypes.forEach((type) => {
      activityTypeStats[type] = 0;
    });

    // 填充实际统计数据
    activityTypeData.forEach((item) => {
      activityTypeStats[item.activityType] = item._count.activityType;
    });

    // 处理小时统计数据，确保0-23小时都有数据
    const hourlyStats: Array<{ hour: number; count: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const found = hourlyData.find((item) => item.hour === hour);
      hourlyStats.push({
        hour,
        count: found ? found.count : 0,
      });
    }

    const stats: ActivityStats = {
      totalActivities,
      todayActivities,
      suspiciousActivities,
      failedActivities,
      activityTypeStats,
      hourlyStats,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch activity stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity stats" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";

import {
  type ActivityStatus,
  type ActivityType,
  type ResourceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  ActivityLogQueryParams,
  ActivityLogResponse,
} from "@/lib/types/activity-log";

// 管理员获取活动日志列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const params: ActivityLogQueryParams = {
      page: Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1),
      pageSize: Math.min(
        Math.max(1, parseInt(searchParams.get("pageSize") ?? "20") || 20),
        100,
      ),
      userId: searchParams.get("userId") ?? undefined,
      activityType:
        (searchParams.get("activityType") as ActivityType) || undefined,
      activityStatus:
        (searchParams.get("activityStatus") as ActivityStatus) || undefined,
      resourceType:
        (searchParams.get("resourceType") as ResourceType) || undefined,
      isSuspicious:
        searchParams.get("isSuspicious") === "true"
          ? true
          : searchParams.get("isSuspicious") === "false"
            ? false
            : undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      riskScoreMin: searchParams.get("riskScoreMin")
        ? parseInt(searchParams.get("riskScoreMin")!)
        : undefined,
      riskScoreMax: searchParams.get("riskScoreMax")
        ? parseInt(searchParams.get("riskScoreMax")!)
        : undefined,
    };

    // 构建查询条件
    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.activityType && params.activityType !== "all") {
      where.activityType = params.activityType;
    }

    if (params.activityStatus && params.activityStatus !== "all") {
      where.activityStatus = params.activityStatus;
    }

    if (params.resourceType && params.resourceType !== "all") {
      where.resourceType = params.resourceType;
    }

    if (params.isSuspicious !== undefined && params.isSuspicious !== "all") {
      where.isSuspicious = params.isSuspicious;
    }

    // 时间范围过滤
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.timestamp.lte = new Date(params.endDate);
      }
    }

    // 风险评分范围过滤
    if (
      params.riskScoreMin !== undefined ||
      params.riskScoreMax !== undefined
    ) {
      where.riskScore = {};
      if (params.riskScoreMin !== undefined) {
        where.riskScore.gte = params.riskScoreMin;
      }
      if (params.riskScoreMax !== undefined) {
        where.riskScore.lte = params.riskScoreMax;
      }
    }

    // 搜索过滤（用户名、邮箱、资源标题、IP地址）
    if (params.search?.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        {
          user: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
        { resourceTitle: { contains: searchTerm, mode: "insensitive" } },
        { ipAddress: { contains: searchTerm } },
        { location: { contains: searchTerm } },
      ];
    }

    // 计算分页
    const skip = (params.page! - 1) * params.pageSize!;

    // 并行执行查询和计数
    const [activities, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: params.pageSize,
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / params.pageSize!);

    const response: ActivityLogResponse = {
      data: activities,
      total,
      page: params.page!,
      pageSize: params.pageSize!,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 },
    );
  }
}

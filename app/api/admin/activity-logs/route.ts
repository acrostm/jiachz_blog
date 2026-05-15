import { type NextRequest, NextResponse } from "next/server";

import {
  ActivityStatus,
  ActivityType,
  type Prisma,
  ResourceType,
} from "@prisma/client";

import { requireAdmin } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type {
  ActivityLogQueryParams,
  ActivityLogResponse,
} from "@/lib/types/activity-log";

const parseInteger = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = parseInteger(value, fallback);
  return parsed > 0 ? parsed : fallback;
};

const parseBoundedInt = (
  value: string | null,
  fallback: number,
  min: number,
  max: number,
) => Math.min(Math.max(parseInteger(value, fallback), min), max);

const parseEnumParam = <T extends Record<string, string>>(
  enumObject: T,
  value: string | null,
) => {
  if (!value || value === "all") {
    return undefined;
  }

  const values = Object.values(enumObject) as Array<T[keyof T]>;
  return values.includes(value as T[keyof T])
    ? (value as T[keyof T])
    : undefined;
};

const parseDateParam = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// 管理员获取活动日志列表
export async function GET(request: NextRequest) {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const params: ActivityLogQueryParams = {
      page: parsePositiveInt(searchParams.get("page"), 1),
      pageSize: parseBoundedInt(searchParams.get("pageSize"), 20, 1, 100),
      userId: searchParams.get("userId") ?? undefined,
      activityType: parseEnumParam(
        ActivityType,
        searchParams.get("activityType"),
      ),
      activityStatus: parseEnumParam(
        ActivityStatus,
        searchParams.get("activityStatus"),
      ),
      resourceType: parseEnumParam(
        ResourceType,
        searchParams.get("resourceType"),
      ),
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
        ? parseBoundedInt(searchParams.get("riskScoreMin"), 0, 0, 100)
        : undefined,
      riskScoreMax: searchParams.get("riskScoreMax")
        ? parseBoundedInt(searchParams.get("riskScoreMax"), 100, 0, 100)
        : undefined,
    };

    // 构建查询条件
    const where: Prisma.UserActivityLogWhereInput = {};

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
      const startDate = parseDateParam(params.startDate);
      const endDate = parseDateParam(params.endDate);
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
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
            name: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: searchTerm, mode: "insensitive" },
          },
        },
        { resourceTitle: { contains: searchTerm, mode: "insensitive" } },
        { ipAddress: { contains: searchTerm, mode: "insensitive" } },
        { location: { contains: searchTerm, mode: "insensitive" } },
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
    logger.error("Failed to fetch activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 },
    );
  }
}

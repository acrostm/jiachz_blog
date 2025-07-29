import { type NextRequest, NextResponse } from "next/server";

import {
  type LoginActivity,
  type LoginMethod,
  type LoginStatus,
} from "@prisma/client";

import { noPermission } from "@/features/user";
import { prisma } from "@/lib/prisma";

interface LoginLogsQuery {
  page?: string;
  pageSize?: string;
  userId?: string;
  loginStatus?: string;
  loginMethod?: string;
  isSuspicious?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // 搜索用户名或邮箱
}

interface LoginActivityWithUser extends LoginActivity {
  user: {
    name: string | null;
    email: string | null;
  };
}

/**
 * API endpoint for admin to get all login logs with filtering and pagination
 * GET /api/admin/login-logs?page=1&pageSize=20&userId=xxx&loginStatus=SUCCESS...
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user has admin permissions
    if (await noPermission()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query: LoginLogsQuery = {
      page: searchParams.get("page") ?? "1",
      pageSize: searchParams.get("pageSize") ?? "20",
      userId: searchParams.get("userId") ?? undefined,
      loginStatus: searchParams.get("loginStatus") ?? undefined,
      loginMethod: searchParams.get("loginMethod") ?? undefined,
      isSuspicious: searchParams.get("isSuspicious") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const page = Math.max(1, parseInt(query.page!));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize!))); // Cap at 100
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    // Filter by user ID
    if (query.userId) {
      where.userId = query.userId;
    }

    // Filter by login status
    if (
      query.loginStatus &&
      query.loginStatus !== "all" &&
      Object.values(LoginStatus).includes(query.loginStatus as LoginStatus)
    ) {
      where.loginStatus = query.loginStatus as LoginStatus;
    }

    // Filter by login method
    if (
      query.loginMethod &&
      query.loginMethod !== "all" &&
      Object.values(LoginMethod).includes(query.loginMethod as LoginMethod)
    ) {
      where.loginMethod = query.loginMethod as LoginMethod;
    }

    // Filter by suspicious flag
    if (query.isSuspicious && query.isSuspicious !== "all") {
      where.isSuspicious = query.isSuspicious === "true";
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      where.loginAt = {};
      if (query.startDate) {
        where.loginAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.loginAt.lte = new Date(query.endDate);
      }
    }

    // Search in user name or email
    if (query.search) {
      where.OR = [
        {
          user: {
            name: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.loginActivity.count({ where });

    // Get login activities with user information
    const loginActivities = (await prisma.loginActivity.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        loginAt: "desc",
      },
      skip,
      take: pageSize,
    })) as LoginActivityWithUser[];

    // Format response data
    const formattedData = loginActivities.map((activity) => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.user.name,
      userEmail: activity.user.email,
      loginAt: activity.loginAt,
      loginStatus: activity.loginStatus,
      loginMethod: activity.loginMethod,
      sessionId: activity.sessionId,
      ipAddress: activity.ipAddress,
      location: activity.location,
      country: activity.country,
      region: activity.region,
      city: activity.city,
      countryCode: activity.countryCode,
      userAgent: activity.userAgent,
      browserName: activity.browserName,
      browserVersion: activity.browserVersion,
      operatingSystem: activity.operatingSystem,
      deviceType: activity.deviceType,
      deviceFingerprint: activity.deviceFingerprint,
      isSuspicious: activity.isSuspicious,
      suspiciousReasons: activity.suspiciousReasons,
      riskScore: activity.riskScore,
      previousLoginIp: activity.previousLoginIp,
      previousLoginLocation: activity.previousLoginLocation,
      timeSinceLastLogin: activity.timeSinceLastLogin,
      locationChanged: activity.locationChanged,
      newDevice: activity.newDevice,
      failureReason: activity.failureReason,
      blockedReason: activity.blockedReason,
      createdAt: activity.createdAt,
    }));

    return NextResponse.json({
      data: formattedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Failed to get login logs:", error);
    return NextResponse.json(
      { error: "Failed to get login logs" },
      { status: 500 },
    );
  }
}

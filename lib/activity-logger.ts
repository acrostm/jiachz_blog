/**
 * 通用用户活动日志记录服务
 * 基于现有的LoginTrackingService扩展，支持所有用户操作的日志记录
 */
import { headers } from "next/headers";

import {
  type ActivityStatus,
  type ActivityType,
  DeviceType,
  type Prisma,
  type UserActivityLog,
} from "@prisma/client";
import { UAParser } from "ua-parser-js";

import { type GeolocationResult, geolocationService } from "./geolocation";
import { logger } from "./logger";
import { prisma } from "./prisma";
import type {
  ActionDetails,
  ActivityLogData,
  NetworkDeviceInfo,
  SecurityAnalysis,
} from "./types/activity-log";

type SuspiciousActivityLog = Prisma.UserActivityLogGetPayload<{
  include: {
    user: {
      select: {
        email: true;
        name: true;
      };
    };
  };
}>;

const isUnsafeJsonChar = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x00 && code <= 0x1f) ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0xfffe ||
    code === 0xffff
  );
};

export class ActivityLogger {
  /**
   * 安全的JSON字符串化，清理无效字符
   */
  private safeStringify(obj: unknown): string {
    try {
      // 先转换为JSON字符串
      const jsonStr = JSON.stringify(obj);
      // 清理无效的UTF-8字符和控制字符
      return [...jsonStr].filter((char) => !isUnsafeJsonChar(char)).join("");
    } catch (error) {
      logger.warn("Failed to stringify object, using fallback:", error);
      return JSON.stringify({ error: "Failed to serialize data" });
    }
  }

  /**
   * 获取客户端IP地址
   */
  private async getClientIP(): Promise<string> {
    try {
      const headersList = await headers();

      const forwardedFor = headersList.get("x-forwarded-for");
      const realIP = headersList.get("x-real-ip");
      const cfConnectingIP = headersList.get("cf-connecting-ip");

      let ip = "unknown";

      if (forwardedFor) {
        ip = forwardedFor.split(",")[0]?.trim() ?? "unknown";
      } else if (realIP) {
        ip = realIP;
      } else if (cfConnectingIP) {
        ip = cfConnectingIP;
      }

      return ip;
    } catch {
      return "unknown";
    }
  }

  /**
   * 解析设备和浏览器信息
   */
  private parseDeviceInfo(
    userAgent: string,
  ): Omit<
    NetworkDeviceInfo,
    "ipAddress" | "location" | "country" | "region" | "city" | "countryCode"
  > {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType: DeviceType = DeviceType.UNKNOWN;
    if (result.device.type === "mobile") {
      deviceType = DeviceType.MOBILE;
    } else if (result.device.type === "tablet") {
      deviceType = DeviceType.TABLET;
    } else if (result.device.type === undefined && result.os.name) {
      deviceType = DeviceType.DESKTOP;
    }

    const fingerprint = Buffer.from(
      `${result.browser.name ?? ""}-${result.browser.version ?? ""}-${result.os.name ?? ""}-${result.os.version ?? ""}`,
    ).toString("base64");

    return {
      userAgent,
      browserName: result.browser.name ?? "Unknown",
      browserVersion: result.browser.version ?? "Unknown",
      operatingSystem:
        `${result.os.name ?? "Unknown"} ${result.os.version ?? ""}`.trim(),
      deviceType,
      deviceFingerprint: fingerprint,
    };
  }

  /**
   * 获取用户最近的成功活动记录（用于安全分析）
   */
  private async getPreviousActivity(
    userId: string,
    activityType?: ActivityType,
  ): Promise<UserActivityLog | null> {
    return await prisma.userActivityLog.findFirst({
      where: {
        userId,
        activityStatus: "SUCCESS",
        ...(activityType && { activityType }),
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * 分析活动的可疑性
   */
  private analyzeActivitySecurity(
    userId: string,
    activityType: ActivityType,
    currentIP: string,
    currentLocation: string,
    deviceInfo: Omit<
      NetworkDeviceInfo,
      "ipAddress" | "location" | "country" | "region" | "city" | "countryCode"
    >,
    previousActivity: UserActivityLog | null,
  ): SecurityAnalysis {
    const suspiciousReasons: string[] = [];
    let riskScore = 0;

    if (!previousActivity) {
      // 首次活动，根据活动类型判断风险
      if (
        ["ADMIN_ACCESS", "USER_MANAGE", "SYSTEM_CONFIG"].includes(activityType)
      ) {
        riskScore += 20; // 管理操作风险较高
        suspiciousReasons.push("首次执行管理操作");
      }
      return {
        isSuspicious: riskScore >= 50,
        suspiciousReasons,
        riskScore,
      };
    }

    // 计算时间间隔
    const timeDiff =
      Date.now() - new Date(previousActivity.timestamp).getTime();
    const minutesSinceLastActivity = Math.floor(timeDiff / (1000 * 60));

    // 检查位置变化
    if (
      previousActivity.location &&
      previousActivity.location !== currentLocation
    ) {
      riskScore += 25;
      suspiciousReasons.push("地理位置发生变化");
    }

    // 检查IP变化
    if (previousActivity.ipAddress !== currentIP) {
      if (previousActivity.location !== currentLocation) {
        riskScore += 30;
        suspiciousReasons.push("IP地址和位置都发生变化");
      } else {
        riskScore += 15;
        suspiciousReasons.push("IP地址发生变化");
      }
    }

    // 检查设备变化
    if (previousActivity.deviceFingerprint !== deviceInfo.deviceFingerprint) {
      riskScore += 20;
      suspiciousReasons.push("检测到新设备或浏览器");
    }

    // 检查操作频率
    if (minutesSinceLastActivity < 1) {
      riskScore += 25;
      suspiciousReasons.push("操作频率异常");
    }

    // 检查高风险操作
    if (
      [
        "ADMIN_ACCESS",
        "USER_MANAGE",
        "SYSTEM_CONFIG",
        "PASSWORD_CHANGE",
      ].includes(activityType)
    ) {
      riskScore += 15;
      suspiciousReasons.push("执行高风险操作");
    }

    // 检查操作系统变化
    if (previousActivity.operatingSystem !== deviceInfo.operatingSystem) {
      riskScore += 20;
      suspiciousReasons.push("操作系统发生变化");
    }

    // 检查浏览器变化
    if (previousActivity.browserName !== deviceInfo.browserName) {
      riskScore += 15;
      suspiciousReasons.push("浏览器发生变化");
    }

    return {
      isSuspicious: riskScore >= 50,
      suspiciousReasons,
      riskScore,
    };
  }

  /**
   * 记录用户活动
   */
  async logActivity(data: ActivityLogData): Promise<void> {
    try {
      let userAgent = "Unknown";
      try {
        const headersList = await headers();
        userAgent = headersList.get("user-agent") ?? "Unknown";
      } catch {
        // headers() not available in this context
      }

      const ip = await this.getClientIP();

      // 获取地理位置信息
      const locationResult: GeolocationResult =
        await geolocationService.getLocationByIP(ip);

      // 解析设备信息
      const deviceInfo = this.parseDeviceInfo(userAgent);

      // 获取上一次同类型活动记录进行对比
      const previousActivity = await this.getPreviousActivity(
        data.userId,
        data.activityType,
      );

      // 安全分析
      const securityAnalysis = this.analyzeActivitySecurity(
        data.userId,
        data.activityType,
        ip,
        locationResult.location,
        deviceInfo,
        previousActivity,
      );

      // 创建活动日志记录
      await prisma.userActivityLog.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          activityStatus: data.activityStatus,

          // 资源信息
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          resourceTitle: data.resourceTitle,

          // 操作详情
          actionDetails: data.actionDetails
            ? this.safeStringify(data.actionDetails)
            : null,

          // 网络和设备信息
          ipAddress: ip,
          userAgent,
          location: locationResult.location,
          country: locationResult.fullInfo?.country,
          region: locationResult.fullInfo?.region,
          city: locationResult.fullInfo?.city,
          countryCode: locationResult.fullInfo?.countryCode,

          // 设备信息
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          operatingSystem: deviceInfo.operatingSystem,
          deviceType: deviceInfo.deviceType,
          deviceFingerprint: deviceInfo.deviceFingerprint,

          // 安全分析
          isSuspicious: securityAnalysis.isSuspicious,
          suspiciousReasons: this.safeStringify(
            securityAnalysis.suspiciousReasons,
          ),
          riskScore: securityAnalysis.riskScore,

          // 会话和错误信息
          sessionId: data.sessionId,
          errorMessage: data.errorMessage,
          errorCode: data.errorCode,

          // 元数据
          metadata: data.metadata ? this.safeStringify(data.metadata) : null,
        },
      });

      // 如果是可疑活动，记录警告日志
      if (securityAnalysis.isSuspicious) {
        logger.warn(
          `Suspicious activity detected for user ${data.userId}: ${data.activityType} - ${securityAnalysis.suspiciousReasons.join(", ")} (Risk Score: ${securityAnalysis.riskScore})`,
        );
      }
    } catch (error) {
      logger.error("Failed to log activity:", error);
      // 不抛出错误，避免影响主要业务流程
    }
  }

  /**
   * 便捷方法：记录认证活动
   */
  async logAuthActivity(
    userId: string,
    activityType: "REGISTER" | "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE",
    status: ActivityStatus,
    metadata?: Record<string, unknown>,
    sessionId?: string,
  ): Promise<void> {
    await this.logActivity({
      userId,
      activityType,
      activityStatus: status,
      resourceType: "USER",
      resourceId: userId,
      metadata,
      sessionId,
    });
  }

  /**
   * 专门的登录追踪方法（替代原loginTracker.trackLogin）
   */
  async trackLogin(data: {
    userId: string;
    loginMethod: "CREDENTIALS" | "OAUTH_GITHUB" | "OAUTH_GOOGLE" | "OTP";
    loginStatus: "SUCCESS" | "FAILED" | "BLOCKED" | "SUSPICIOUS";
    sessionId?: string;
    failureReason?: string;
    blockedReason?: string;
  }): Promise<void> {
    const metadata = {
      loginMethod: data.loginMethod,
      ...(data.failureReason && { failureReason: data.failureReason }),
      ...(data.blockedReason && { blockedReason: data.blockedReason }),
    };

    await this.logAuthActivity(
      data.userId,
      "LOGIN",
      data.loginStatus as ActivityStatus,
      metadata,
      data.sessionId,
    );
  }

  /**
   * 获取用户登录历史（替代原loginTracker.getUserLoginHistory）
   */
  async getUserLoginHistory(userId: string, limit = 50) {
    return await this.getUserActivityHistory(userId, limit, "LOGIN");
  }

  /**
   * 获取可疑登录（替代原loginTracker.getSuspiciousLogins）
   */
  async getSuspiciousLogins(limit = 100) {
    return await prisma.userActivityLog.findMany({
      where: {
        activityType: "LOGIN",
        isSuspicious: true,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 便捷方法：记录内容操作活动
   */
  async logContentActivity(
    userId: string,
    activityType: ActivityType,
    status: ActivityStatus,
    resourceType: "BLOG" | "NOTE",
    resourceId: string,
    resourceTitle?: string,
    actionDetails?: ActionDetails,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.logActivity({
      userId,
      activityType,
      activityStatus: status,
      resourceType,
      resourceId,
      resourceTitle,
      actionDetails: actionDetails ? { ...actionDetails } : undefined,
      metadata,
    });
  }

  /**
   * 便捷方法：记录管理操作活动
   */
  async logAdminActivity(
    userId: string,
    activityType: "ADMIN_ACCESS" | "USER_MANAGE" | "SYSTEM_CONFIG",
    status: ActivityStatus,
    actionDetails?: ActionDetails,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.logActivity({
      userId,
      activityType,
      activityStatus: status,
      resourceType: "SYSTEM",
      actionDetails: actionDetails ? { ...actionDetails } : undefined,
      metadata,
    });
  }

  /**
   * 获取用户活动历史
   */
  async getUserActivityHistory(
    userId: string,
    limit = 50,
    activityType?: ActivityType,
  ): Promise<UserActivityLog[]> {
    return await prisma.userActivityLog.findMany({
      where: {
        userId,
        ...(activityType && { activityType }),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * 获取可疑活动
   */
  async getSuspiciousActivities(limit = 100): Promise<SuspiciousActivityLog[]> {
    return await prisma.userActivityLog.findMany({
      where: { isSuspicious: true },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 获取活动统计
   */
  async getActivityStats(userId?: string): Promise<{
    totalCount: number;
    todayCount: number;
    suspiciousCount: number;
    failedCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = userId ? { userId } : {};

    const [totalCount, todayCount, suspiciousCount, failedCount] =
      await Promise.all([
        prisma.userActivityLog.count({ where }),
        prisma.userActivityLog.count({
          where: {
            ...where,
            timestamp: { gte: today },
          },
        }),
        prisma.userActivityLog.count({
          where: {
            ...where,
            isSuspicious: true,
          },
        }),
        prisma.userActivityLog.count({
          where: {
            ...where,
            activityStatus: "FAILED",
          },
        }),
      ]);

    return {
      totalCount,
      todayCount,
      suspiciousCount,
      failedCount,
    };
  }
}

// 导出单例实例
export const activityLogger = new ActivityLogger();

// 登录追踪功能已完全集成到ActivityLogger中
// 使用 activityLogger.logAuthActivity() 记录登录活动
// 使用 activityLogger.getUserActivityHistory(userId, limit, 'LOGIN') 获取登录历史
// 使用 activityLogger.getSuspiciousActivities() 获取可疑活动

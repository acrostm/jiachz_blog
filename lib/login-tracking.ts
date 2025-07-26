/**
 * Comprehensive login tracking and suspicious activity detection service
 */
import { headers } from "next/headers";

import {
  DeviceType,
  type LoginActivity,
  type LoginMethod,
  type LoginStatus,
} from "@prisma/client";
import { UAParser } from "ua-parser-js";

import { type GeolocationResult, geolocationService } from "./geolocation";
import { prisma } from "./prisma";

export interface LoginTrackingData {
  userId: string;
  loginMethod: LoginMethod;
  loginStatus: LoginStatus;
  sessionId?: string;
  failureReason?: string;
  blockedReason?: string;
}

export interface DeviceInfo {
  userAgent: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: DeviceType;
  deviceFingerprint: string;
}

export interface SuspiciousLoginAnalysis {
  isSuspicious: boolean;
  suspiciousReasons: string[];
  riskScore: number;
  locationChanged: boolean;
  newDevice: boolean;
  timeSinceLastLogin?: number;
}

class LoginTrackingService {
  /**
   * Get client IP address from request headers
   */
  private getClientIP(): string {
    try {
      const headersList = headers();

      // Try multiple header sources for IP
      const forwardedFor = headersList.get("x-forwarded-for");
      const realIP = headersList.get("x-real-ip");
      const cfConnectingIP = headersList.get("cf-connecting-ip"); // Cloudflare

      let ip = "unknown";

      if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        ip = forwardedFor.split(",")[0].trim();
      } else if (realIP) {
        ip = realIP;
      } else if (cfConnectingIP) {
        ip = cfConnectingIP;
      }

      return ip;
    } catch (error) {
      // headers() is not available in this context (e.g., NextAuth callback)
      return "unknown";
    }
  }

  /**
   * Parse device and browser information from user agent
   */
  private parseDeviceInfo(userAgent: string): DeviceInfo {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType = DeviceType.UNKNOWN;
    if (result.device.type === "mobile") {
      deviceType = DeviceType.MOBILE;
    } else if (result.device.type === "tablet") {
      deviceType = DeviceType.TABLET;
    } else if (result.device.type === undefined && result.os.name) {
      deviceType = DeviceType.DESKTOP;
    }

    // Create a simple device fingerprint
    const fingerprint = Buffer.from(
      `${result.browser.name}-${result.browser.version}-${result.os.name}-${result.os.version}`,
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
   * Get the user's previous login for comparison
   */
  private async getPreviousLogin(
    userId: string,
  ): Promise<LoginActivity | null> {
    return await prisma.loginActivity.findFirst({
      where: {
        userId,
        loginStatus: "SUCCESS",
      },
      orderBy: {
        loginAt: "desc",
      },
    });
  }

  /**
   * Analyze if the login is suspicious based on various factors
   */
  private analyzeSuspiciousActivity(
    userId: string,
    currentIP: string,
    currentLocation: string,
    deviceInfo: DeviceInfo,
    previousLogin: LoginActivity | null,
  ): SuspiciousLoginAnalysis {
    const suspiciousReasons: string[] = [];
    let riskScore = 0;
    let locationChanged = false;
    let newDevice = false;
    let timeSinceLastLogin: number | undefined;

    if (!previousLogin) {
      // First time login, not suspicious
      return {
        isSuspicious: false,
        suspiciousReasons: [],
        riskScore: 0,
        locationChanged: false,
        newDevice: true,
        timeSinceLastLogin: undefined,
      };
    }

    // Calculate time since last login
    const timeDiff = Date.now() - new Date(previousLogin.loginAt).getTime();
    timeSinceLastLogin = Math.floor(timeDiff / (1000 * 60)); // minutes

    // Check location change
    if (previousLogin.location && previousLogin.location !== currentLocation) {
      locationChanged = true;
      riskScore += 20;
      suspiciousReasons.push("登录地点发生变化");
    }

    // Check IP change (different IP but same location is less suspicious)
    if (previousLogin.ipAddress !== currentIP) {
      if (locationChanged) {
        riskScore += 30; // Different IP and location is more suspicious
        suspiciousReasons.push("IP地址和位置都发生变化");
      } else {
        riskScore += 10; // Same location but different IP (e.g., different network)
        suspiciousReasons.push("IP地址发生变化");
      }
    }

    // Check device fingerprint
    if (previousLogin.deviceFingerprint !== deviceInfo.deviceFingerprint) {
      newDevice = true;
      riskScore += 25;
      suspiciousReasons.push("检测到新设备或浏览器");
    }

    // Check unusual login time patterns
    if (timeSinceLastLogin < 5) {
      // Very quick re-login might be suspicious
      riskScore += 15;
      suspiciousReasons.push("短时间内频繁登录");
    } else if (timeSinceLastLogin > 43200) {
      // 30 days
      // Long time since last login
      riskScore += 10;
      suspiciousReasons.push("长时间未登录");
    }

    // Check if login is from a significantly different browser/OS
    if (previousLogin.browserName !== deviceInfo.browserName) {
      riskScore += 15;
      suspiciousReasons.push("使用不同的浏览器");
    }

    if (previousLogin.operatingSystem !== deviceInfo.operatingSystem) {
      riskScore += 20;
      suspiciousReasons.push("使用不同的操作系统");
    }

    // Determine if login is suspicious (threshold: 50+)
    const isSuspicious = riskScore >= 50;

    return {
      isSuspicious,
      suspiciousReasons,
      riskScore,
      locationChanged,
      newDevice,
      timeSinceLastLogin,
    };
  }

  /**
   * Track a login attempt with comprehensive logging
   */
  async trackLogin(data: LoginTrackingData): Promise<void> {
    try {
      let userAgent = "Unknown";
      try {
        const headersList = headers();
        userAgent = headersList.get("user-agent") || "Unknown";
      } catch {
        // headers() not available in this context
      }

      const ip = this.getClientIP();

      // Get location information
      const locationResult: GeolocationResult =
        await geolocationService.getLocationByIP(ip);

      // Parse device information
      const deviceInfo = this.parseDeviceInfo(userAgent);

      // Get previous login for comparison
      const previousLogin = await this.getPreviousLogin(data.userId);

      // Analyze suspicious activity
      const suspiciousAnalysis = await this.analyzeSuspiciousActivity(
        data.userId,
        ip,
        locationResult.location,
        deviceInfo,
        previousLogin,
      );

      // Create the login activity record
      await prisma.loginActivity.create({
        data: {
          userId: data.userId,
          loginStatus: data.loginStatus,
          loginMethod: data.loginMethod,
          sessionId: data.sessionId,

          // Network & Location
          ipAddress: ip,
          location: locationResult.location,
          country: locationResult.fullInfo?.country,
          region: locationResult.fullInfo?.region,
          city: locationResult.fullInfo?.city,
          countryCode: locationResult.fullInfo?.countryCode,

          // Device & Browser
          userAgent,
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          operatingSystem: deviceInfo.operatingSystem,
          deviceType: deviceInfo.deviceType,
          deviceFingerprint: deviceInfo.deviceFingerprint,

          // Security Analysis
          isSuspicious: suspiciousAnalysis.isSuspicious,
          suspiciousReasons: JSON.stringify(
            suspiciousAnalysis.suspiciousReasons,
          ),
          riskScore: suspiciousAnalysis.riskScore,

          // Previous Login Comparison
          previousLoginIp: previousLogin?.ipAddress,
          previousLoginLocation: previousLogin?.location,
          timeSinceLastLogin: suspiciousAnalysis.timeSinceLastLogin,
          locationChanged: suspiciousAnalysis.locationChanged,
          newDevice: suspiciousAnalysis.newDevice,

          // Failure/Block reasons
          failureReason: data.failureReason,
          blockedReason: data.blockedReason,
        },
      });

      // Update user's last login info if successful
      if (data.loginStatus === "SUCCESS") {
        await prisma.user.update({
          where: { id: data.userId },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: ip,
            lastLoginLocation: locationResult.location,
          },
        });
      }

      // Log suspicious activity (you might want to send alerts here)
      if (suspiciousAnalysis.isSuspicious) {
        console.warn(
          `Suspicious login detected for user ${data.userId}: ${suspiciousAnalysis.suspiciousReasons.join(", ")} (Risk Score: ${suspiciousAnalysis.riskScore})`,
        );
      }
    } catch (error) {
      console.error("Failed to track login:", error);
      // Don't throw error to avoid breaking authentication flow
    }
  }

  /**
   * Get login history for a user
   */
  async getUserLoginHistory(
    userId: string,
    limit = 50,
  ): Promise<LoginActivity[]> {
    return await prisma.loginActivity.findMany({
      where: { userId },
      orderBy: { loginAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get suspicious logins for security monitoring
   */
  async getSuspiciousLogins(limit = 100): Promise<LoginActivity[]> {
    return await prisma.loginActivity.findMany({
      where: { isSuspicious: true },
      orderBy: { loginAt: "desc" },
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
}

// Export singleton instance
export const loginTracker = new LoginTrackingService();

// Export class for custom instances
export { LoginTrackingService };

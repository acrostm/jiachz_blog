import { type NextRequest, NextResponse } from "next/server";

import { noPermission } from "@/features/user";
import { loginTracker } from "@/lib/login-tracking";

/**
 * API endpoint for administrators to view suspicious logins
 * GET /api/admin/suspicious-logins?limit=100
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user has admin permissions
    if (await noPermission()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "100");

    // Get suspicious logins with user information
    const suspiciousLogins = await loginTracker.getSuspiciousLogins(
      Math.min(limit, 500), // Cap at 500 records
    );

    // Include additional details for admin view
    const detailedLogins = suspiciousLogins.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email,
      userName: log.user?.name,
      loginAt: log.loginAt,
      loginStatus: log.loginStatus,
      loginMethod: log.loginMethod,
      ipAddress: log.ipAddress,
      location: log.location,
      country: log.country,
      region: log.region,
      city: log.city,
      browserName: log.browserName,
      browserVersion: log.browserVersion,
      operatingSystem: log.operatingSystem,
      deviceType: log.deviceType,
      isSuspicious: log.isSuspicious,
      suspiciousReasons: log.suspiciousReasons,
      riskScore: log.riskScore,
      locationChanged: log.locationChanged,
      newDevice: log.newDevice,
      previousLoginIp: log.previousLoginIp,
      previousLoginLocation: log.previousLoginLocation,
      timeSinceLastLogin: log.timeSinceLastLogin,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      suspiciousLogins: detailedLogins,
      total: detailedLogins.length,
    });
  } catch (error) {
    console.error("Failed to get suspicious logins:", error);
    return NextResponse.json(
      { error: "Failed to get suspicious logins" },
      { status: 500 },
    );
  }
}

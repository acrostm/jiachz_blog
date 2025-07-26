import { type NextRequest, NextResponse } from "next/server";

// import { noPermission } from "@/features/user";
import { auth } from "@/lib/auth";
import { loginTracker } from "@/lib/login-tracking";

/**
 * API endpoint for getting user's login history
 * GET /api/auth/login-history?limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get user's login history
    const loginHistory = await loginTracker.getUserLoginHistory(
      session.user.id,
      Math.min(limit, 200), // Cap at 200 records
    );

    // Remove sensitive information for regular users
    const sanitizedHistory = loginHistory.map((log) => ({
      id: log.id,
      loginAt: log.loginAt,
      loginStatus: log.loginStatus,
      loginMethod: log.loginMethod,
      ipAddress: log.ipAddress,
      location: log.location,
      browserName: log.browserName,
      browserVersion: log.browserVersion,
      operatingSystem: log.operatingSystem,
      deviceType: log.deviceType,
      isSuspicious: log.isSuspicious,
      suspiciousReasons: log.suspiciousReasons,
      riskScore: log.riskScore,
      locationChanged: log.locationChanged,
      newDevice: log.newDevice,
      timeSinceLastLogin: log.timeSinceLastLogin,
    }));

    return NextResponse.json({
      loginHistory: sanitizedHistory,
      total: sanitizedHistory.length,
    });
  } catch (error) {
    console.error("Failed to get login history:", error);
    return NextResponse.json(
      { error: "Failed to get login history" },
      { status: 500 },
    );
  }
}

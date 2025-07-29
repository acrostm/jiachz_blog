import { type NextRequest, NextResponse } from "next/server";

import { LoginMethod, LoginStatus } from "@prisma/client";

import { loginTracker } from "@/lib/login-tracking";

interface TrackLoginBody {
  userId: string;
  loginMethod: string;
  sessionId?: string;
}

/**
 * API endpoint for comprehensive login tracking
 * This is called by client-side code after successful authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TrackLoginBody;
    const { userId, loginMethod, sessionId } = body;

    if (!userId || !loginMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Map string to enum
    let method: LoginMethod;
    switch (loginMethod.toLowerCase()) {
      case "github":
        method = LoginMethod.OAUTH_GITHUB;
        break;
      case "google":
        method = LoginMethod.OAUTH_GOOGLE;
        break;
      case "credentials":
        method = LoginMethod.CREDENTIALS;
        break;
      default:
        method = LoginMethod.CREDENTIALS;
    }

    // Track the login with full request context
    await loginTracker.trackLogin({
      userId,
      loginMethod: method,
      loginStatus: LoginStatus.SUCCESS,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Login tracking failed" },
      { status: 500 },
    );
  }
}

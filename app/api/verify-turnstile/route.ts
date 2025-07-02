import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Turnstile token is missing." },
        { status: 400 },
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error("Turnstile secret key is not configured.");
      return NextResponse.json(
        {
          success: false,
          error: "Turnstile secret key is not configured on the server.",
        },
        { status: 500 },
      );
    }

    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    // 可选：如果您在前端传递了 remoteip，则在此处添加
    // formData.append('remoteip', request.ip || '');

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      },
    );

    const outcome = await response.json();

    if (outcome.success) {
      // 令牌验证成功
      // 您可以在此处设置会话、cookie 或执行其他操作以指示用户已通过验证
      return NextResponse.json({ success: true });
    } else {
      // 令牌验证失败
      console.error("Turnstile verification failed:", outcome["error-codes"]);
      return NextResponse.json(
        {
          success: false,
          error: "Turnstile verification failed.",
          "error-codes": outcome["error-codes"],
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error verifying Turnstile token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during Turnstile verification.",
      },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";

import { ActivityStatus, ResourceType } from "@prisma/client";
import { Resend } from "resend";

import { auth } from "@/lib/auth";
import { notifyOtpCode } from "@/lib/notification";
import { prisma } from "@/lib/prisma";
import { safeLogActivity } from "@/lib/utils/activity-logger-helper";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const type =
      typeof body.type === "string" ? body.type : "email-verification";

    const userEmail = session.user.email;

    // 对于邮箱验证，检查用户是否已经验证
    if (type === "email-verification") {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { emailVerified: true },
      });

      if (user?.emailVerified) {
        return NextResponse.json({ message: "邮箱已验证" }, { status: 400 });
      }
    }

    // 检查是否有未过期的OTP
    const existingOtp = await prisma.verificationToken.findFirst({
      where: {
        identifier: userEmail,
        type: type === "password-change" ? "password-change-otp" : "otp",
        expires: { gt: new Date() },
      },
    });

    if (existingOtp) {
      const secondsLeft = Math.ceil(
        (existingOtp.expires.getTime() - Date.now()) / 1000,
      );
      return NextResponse.json(
        { message: `请等待 ${secondsLeft} 秒后再试` },
        { status: 429 },
      );
    }

    // 生成6位随机OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存OTP到数据库（有效期60秒）
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await prisma.verificationToken.create({
      data: {
        identifier: userEmail,
        token: otp,
        expires: expiresAt,
        type: type === "password-change" ? "password-change-otp" : "otp",
      },
    });

    // 发送邮件
    const subject =
      type === "password-change" ? "修改密码验证码" : "邮箱验证码";
    const title = type === "password-change" ? "修改密码验证码" : "邮箱验证码";
    const description =
      type === "password-change"
        ? "您正在修改密码，验证码是："
        : "您的验证码是：";

    await resend.emails.send({
      from: "noreply@jiachz.com",
      to: userEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">${title}</h2>
          <p style="color: #666; font-size: 16px;">${description}</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">此验证码有效期为60秒，请尽快使用。</p>
          <p style="color: #666; font-size: 14px;">如果您没有请求此验证码，请忽略此邮件。</p>
        </div>
      `,
    });

    // 发送bark通知
    try {
      await notifyOtpCode(
        userEmail,
        otp,
        type,
        new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
      );
    } catch (error) {
      // bark通知失败不影响主流程，只记录错误
      console.error("发送bark通知失败:", error);
    }

    // 发送邮件成功后记录日志
    await safeLogActivity(session.user.id, "SEND_OTP", ActivityStatus.SUCCESS, {
      resourceType: ResourceType.USER,
      resourceId: session.user.id,
      actionDetails: {
        action: "send-otp",
        description: `发送${type}验证码`,
      },
    });
    return NextResponse.json({ message: "验证码已发送" });
  } catch (error: any) {
    // 记录失败日志
    let userId = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {}
    await safeLogActivity(userId, "SEND_OTP", ActivityStatus.FAILED, {
      resourceType: ResourceType.USER,
      resourceId: userId,
      actionDetails: {
        action: "send-otp",
        description: "发送验证码失败",
      },
      errorMessage: error?.message ?? String(error),
    });
    return NextResponse.json({ message: "发送验证码失败" }, { status: 500 });
  }
}

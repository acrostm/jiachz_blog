import { type NextRequest, NextResponse } from "next/server";

import { Resend } from "resend";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const userEmail = session.user.email;

    // 检查用户是否已经验证
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { emailVerified: true },
    });

    if (user?.emailVerified) {
      return NextResponse.json({ message: "邮箱已验证" }, { status: 400 });
    }

    // 检查是否有未过期的OTP
    const existingOtp = await prisma.verificationToken.findFirst({
      where: {
        identifier: userEmail,
        type: "otp",
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
        type: "otp",
      },
    });

    // 发送邮件
    await resend.emails.send({
      from: "noreply@jiachz.com",
      to: userEmail,
      subject: "邮箱验证码",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">邮箱验证码</h2>
          <p style="color: #666; font-size: 16px;">您的验证码是：</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">此验证码有效期为60秒，请尽快使用。</p>
          <p style="color: #666; font-size: 14px;">如果您没有请求此验证码，请忽略此邮件。</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "验证码已发送" });
  } catch (e) {
    console.error("Send OTP error:", e);
    return NextResponse.json({ message: "发送验证码失败" }, { status: 500 });
  }
}

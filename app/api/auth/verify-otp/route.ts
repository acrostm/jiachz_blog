import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const otp = typeof body.otp === "string" ? body.otp : "";

    if (!otp) {
      return NextResponse.json({ message: "请输入验证码" }, { status: 400 });
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

    // 查找有效的OTP
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: userEmail,
        token: otp,
        type: "otp",
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: "验证码无效或已过期" },
        { status: 400 },
      );
    }

    // 验证成功，更新用户验证状态
    await prisma.user.update({
      where: { email: userEmail },
      data: { emailVerified: new Date() },
    });

    // 删除已使用的OTP
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: userEmail,
          token: otp,
        },
      },
    });

    // 删除该用户的所有过期OTP
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: userEmail,
        type: "otp",
      },
    });

    return NextResponse.json({
      message: "邮箱验证成功",
      shouldUpdateSession: true,
    });
  } catch {
    return NextResponse.json({ message: "验证失败，请重试" }, { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityStatus, ResourceType } from "@/lib/types/activity-log";
import { safeLogActivity } from "@/lib/utils/activity-logger-helper";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const otp = typeof body.otp === "string" ? body.otp : "";

    if (!currentPassword || !newPassword || !otp) {
      return NextResponse.json({ message: "缺少必要字段" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "新密码至少6位" }, { status: 400 });
    }

    const userEmail = session.user.email;

    // 验证OTP
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: userEmail,
        token: otp,
        type: "password-change-otp",
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: "验证码无效或已过期" },
        { status: 400 },
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { message: "用户不存在或未设置密码" },
        { status: 400 },
      );
    }

    // 由于前端已经验证过密码，这里进行最后一次验证（安全保险）
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: "当前密码错误" }, { status: 400 });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新用户密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
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

    // 删除该用户的所有密码修改相关OTP
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: userEmail,
        type: "password-change-otp",
      },
    });

    // 记录成功日志
    await safeLogActivity(user.id, "PASSWORD_CHANGE", ActivityStatus.SUCCESS, {
      resourceType: ResourceType.USER,
      resourceId: user.id,
      actionDetails: {
        action: "change-password",
        description: "用户修改了密码",
      },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (error: any) {
    // 记录失败日志
    let userId = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {}
    await safeLogActivity(userId, "PASSWORD_CHANGE", ActivityStatus.FAILED, {
      resourceType: ResourceType.USER,
      resourceId: userId,
      actionDetails: {
        action: "change-password",
        description: "用户修改密码失败",
      },
      errorMessage: error?.message ?? String(error),
    });
    return NextResponse.json(
      { message: "密码修改失败，请重试" },
      { status: 500 },
    );
  }
}

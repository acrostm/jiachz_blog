import { type NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    if (!currentPassword) {
      return NextResponse.json({ message: "请输入当前密码" }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ message: "请输入新密码" }, { status: 400 });
    }

    const userEmail = session.user.email;

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { message: "用户不存在或未设置密码" },
        { status: 400 },
      );
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: "当前密码错误" }, { status: 400 });
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { message: "新密码不能与当前密码相同" },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "密码验证成功" });
  } catch {
    return NextResponse.json({ message: "验证失败，请重试" }, { status: 500 });
  }
}

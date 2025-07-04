import { type NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const name = typeof body.name === "string" ? body.name : "";
    const password = typeof body.password === "string" ? body.password : "";
    const image = typeof body.image === "string" ? body.image : undefined;

    if (!email || !name || !password) {
      return NextResponse.json({ message: "缺少必要字段" }, { status: 400 });
    }

    // 检查邮箱是否已注册
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      return NextResponse.json({ message: "邮箱已注册" }, { status: 400 });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        image,
        createdAt: now,
        lastLoginAt: now,
      },
    });

    // 创建 account 记录
    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "credentials",
        providerAccountId: email,
        type: "credentials",
      },
    });

    return NextResponse.json({ message: "注册成功" });
  } catch (e) {
    return NextResponse.json({ message: "注册失败" }, { status: 500 });
  }
}

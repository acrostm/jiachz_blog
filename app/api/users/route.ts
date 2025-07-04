import { NextResponse } from "next/server";

import { deleteUserByID } from "@/features/user";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      image: true,
      createdAt: true,
      lastLoginAt: true,
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  try {
    await deleteUserByID(id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

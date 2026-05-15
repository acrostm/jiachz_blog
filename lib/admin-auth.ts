import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/utils";

export const requireAdmin = async () => {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
};

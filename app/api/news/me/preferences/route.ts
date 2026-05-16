import { NextResponse } from "next/server";

import { z } from "zod";

import {
  getNewsPreference,
  upsertNewsPreference,
} from "@/features/news-server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const preferenceSchema = z.object({
  sourceOrder: z.array(z.string()).optional(),
  hiddenSources: z.array(z.string()).optional(),
  defaultColumn: z
    .enum(["china", "tech", "world", "finance"])
    .nullable()
    .optional(),
});

const requireUserId = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return userId;
};

export const GET = async () => {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const preference = await getNewsPreference(userId);
  return NextResponse.json(preference);
};

export const PUT = async (request: Request) => {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = preferenceSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid preference payload" },
      { status: 400 },
    );
  }

  const preference = await upsertNewsPreference(userId, parsed.data);
  return NextResponse.json(preference);
};

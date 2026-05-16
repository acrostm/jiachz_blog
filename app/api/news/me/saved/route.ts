import { NextResponse } from "next/server";

import { z } from "zod";

import {
  deleteSavedNewsItem,
  getSavedNewsItems,
  saveNewsItem,
} from "@/features/news-server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newsItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().min(1).max(240),
  url: z.string().url(),
  mobileUrl: z.string().url().optional(),
  pubDate: z.union([z.string(), z.number()]).optional(),
  extra: z
    .object({
      hover: z.string().optional(),
      date: z.union([z.string(), z.number()]).optional(),
      info: z.union([z.literal(false), z.string()]).optional(),
      diff: z.number().optional(),
    })
    .optional(),
});

const saveSchema = z.object({
  sourceId: z.string().min(1),
  item: newsItemSchema,
});

const requireUserId = async () => {
  const session = await auth();
  return session?.user?.id ?? null;
};

export const GET = async () => {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const items = await getSavedNewsItems(userId);
  return NextResponse.json({ items });
};

export const POST = async (request: Request) => {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid saved item payload" },
      { status: 400 },
    );
  }

  try {
    const item = await saveNewsItem({
      userId,
      sourceId: parsed.data.sourceId,
      item: parsed.data.item,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save item";
    const status = message.startsWith("Invalid") ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
};

export const DELETE = async (request: Request) => {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId");
  const itemId = url.searchParams.get("itemId");

  if (!sourceId || !itemId) {
    return NextResponse.json(
      { message: "sourceId and itemId are required" },
      { status: 400 },
    );
  }

  await deleteSavedNewsItem({ userId, sourceId, itemId });
  return NextResponse.json({ ok: true });
};

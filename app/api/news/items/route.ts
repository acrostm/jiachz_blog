import { NextResponse } from "next/server";

import { getNewsItems } from "@/features/news-server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const sourceId = url.searchParams.get("source") ?? "";
  const latest = url.searchParams.get("latest") === "true";
  const session = await auth();

  try {
    const data = await getNewsItems({
      sourceId,
      latest,
      viewerId: session?.user?.id,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load news";
    const status = message === "Invalid source id" ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
};

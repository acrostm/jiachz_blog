import { NextResponse } from "next/server";

import { searchSteamGames } from "@/features/steam-prices-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchSteamGames(query);

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to search Steam";

    return NextResponse.json({ message }, { status: 502 });
  }
};

import { NextResponse } from "next/server";

import {
  getSteamDeals,
  normalizeSteamDealLimit,
} from "@/features/steam-prices-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  try {
    const limit = normalizeSteamDealLimit(
      new URL(request.url).searchParams.get("limit"),
    );
    const data = await getSteamDeals(limit);

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Steam deals";

    return NextResponse.json({ message }, { status: 502 });
  }
};

import { NextResponse } from "next/server";

import {
  getSteamPrices,
  parseSteamAppId,
} from "@/features/steam-prices-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const appidText = url.searchParams.get("appid")?.trim() ?? "";
  const appid = parseSteamAppId(appidText);

  if (!appid) {
    return NextResponse.json(
      { message: "Invalid Steam appid" },
      { status: 400 },
    );
  }

  try {
    const data = await getSteamPrices(appid);

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Steam prices";
    const status =
      message === "Invalid Steam appid" || message === "Steam app not found"
        ? 400
        : 502;

    return NextResponse.json({ message }, { status });
  }
};

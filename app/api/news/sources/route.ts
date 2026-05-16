import { NextResponse } from "next/server";

import { getNewsDirectory } from "@/features/news-server";

export const runtime = "nodejs";

export const GET = () => {
  return NextResponse.json(getNewsDirectory());
};

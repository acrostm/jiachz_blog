import { type NextRequest, NextResponse } from "next/server";

import { uploadAvatar } from "@/features/upload";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const result = await uploadAvatar(formData);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url });
}

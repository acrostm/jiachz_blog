import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_FEATURE_RESPONSE = {
  error: "智能搜索功能即将上线",
  message: "Meilisearch 全文搜索功能正在开发中，敬请期待！",
  features: [
    "支持用户名、邮箱、操作类型的智能搜索",
    "支持IP地址、地理位置的模糊搜索",
    "支持时间范围、风险评分的精确筛选",
    "支持同义词搜索和拼写纠错",
    "支持搜索结果高亮显示",
    "支持搜索历史和常用搜索保存",
  ],
  status: "coming_soon",
} as const;

export async function GET() {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    return NextResponse.json(SEARCH_FEATURE_RESPONSE, { status: 501 });
  } catch (error) {
    logger.error("Failed to search activity logs:", error);
    return NextResponse.json(
      { error: "Failed to search activity logs" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    return NextResponse.json(
      {
        error: "同步功能即将上线",
        message: "活动日志同步到 Meilisearch 的功能正在开发中",
        status: "coming_soon",
      },
      { status: 501 },
    );
  } catch (error) {
    logger.error("Failed to sync activity logs:", error);
    return NextResponse.json(
      { error: "Failed to sync activity logs" },
      { status: 500 },
    );
  }
}

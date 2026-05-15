import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  addBarkConfig,
  deleteBarkConfig,
  readBarkConfig,
  updateBarkConfig,
} from "@/lib/bark-config";
import { logger } from "@/lib/logger";
import { isSafePublicHttpUrl } from "@/lib/url-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 获取所有bark配置
 */
export async function GET() {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const config = await readBarkConfig();
    return NextResponse.json(config);
  } catch (error) {
    logger.error("Failed to get bark config:", error);
    return NextResponse.json(
      { error: "Failed to get bark configuration" },
      { status: 500 },
    );
  }
}

/**
 * 创建新的bark配置
 */
export async function POST(request: NextRequest) {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const body = (await request.json()) as {
      name: string;
      url: string;
      enabled?: boolean;
      defaultGroup?: string;
      defaultCategory?: string;
      defaultIcon?: string;
      defaultSound?: string;
      description?: string;
    };

    // 验证必填字段
    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 },
      );
    }

    if (!isSafePublicHttpUrl(body.url)) {
      return NextResponse.json(
        { error: "URL must be a public http(s) endpoint" },
        { status: 400 },
      );
    }

    const newConfig = await addBarkConfig({
      name: body.name,
      url: body.url,
      enabled: body.enabled ?? true,
      defaultGroup: body.defaultGroup ?? "Blog",
      defaultCategory: body.defaultCategory ?? "通知",
      defaultIcon: body.defaultIcon ?? "https://r2.jiachz.com/jiachz-light.svg",
      defaultSound: body.defaultSound ?? "default",
      description: body.description,
    });

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    logger.error("Failed to create bark config:", error);
    return NextResponse.json(
      { error: "Failed to create bark configuration" },
      { status: 500 },
    );
  }
}

/**
 * 更新bark配置
 */
export async function PUT(request: NextRequest) {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const body = (await request.json()) as {
      id: string;
      name?: string;
      url?: string;
      enabled?: boolean;
      defaultGroup?: string;
      defaultCategory?: string;
      defaultIcon?: string;
      defaultSound?: string;
      description?: string;
    };

    // 验证必填字段
    if (!body.id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (body.url && !isSafePublicHttpUrl(body.url)) {
      return NextResponse.json(
        { error: "URL must be a public http(s) endpoint" },
        { status: 400 },
      );
    }

    const updatedConfig = await updateBarkConfig(body.id, {
      name: body.name,
      url: body.url,
      enabled: body.enabled,
      defaultGroup: body.defaultGroup,
      defaultCategory: body.defaultCategory,
      defaultIcon: body.defaultIcon,
      defaultSound: body.defaultSound,
      description: body.description,
    });

    if (!updatedConfig) {
      return NextResponse.json(
        { error: "Bark configuration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedConfig);
  } catch (error) {
    logger.error("Failed to update bark config:", error);
    return NextResponse.json(
      { error: "Failed to update bark configuration" },
      { status: 500 },
    );
  }
}

/**
 * 删除bark配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const success = await deleteBarkConfig(id);

    if (!success) {
      return NextResponse.json(
        { error: "Bark configuration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete bark config:", error);
    return NextResponse.json(
      { error: "Failed to delete bark configuration" },
      { status: 500 },
    );
  }
}

#!/usr/bin/env node

/**
 * 发送构建通知脚本
 * 读取数据库中的bark配置，向所有启用的bark配置发送通知
 */
import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取命令行参数
const args = process.argv.slice(2);
const buildStatus = args[0]; // "success" or "failed"
const currentTime =
  args[1] || new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
const serverIp = args[2] || "Unknown";

const BARK_REQUEST_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (compatible; JiachzBlogBarkNotifier/1.0; +https://jiachz.com)",
};

function isCloudflareChallenge(status, responseText) {
  return (
    status === 403 &&
    (responseText.includes("Just a moment") ||
      responseText.includes("challenges.cloudflare.com") ||
      responseText.includes("__cf_chl_"))
  );
}

function formatBarkErrorResponse(status, responseText) {
  if (isCloudflareChallenge(status, responseText)) {
    return "Cloudflare Managed Challenge blocked the Bark request.";
  }

  return responseText.slice(0, 500);
}

function createBarkGetUrl(baseUrl, payload) {
  const baseWithSlash = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(
    `${encodeURIComponent(payload.title)}/${encodeURIComponent(payload.body)}`,
    baseWithSlash,
  );

  const searchParams = {
    sound: payload.sound,
    group: payload.group,
    category: payload.category,
    icon: payload.icon,
    url: payload.url,
    level: payload.level,
    badge: payload.badge?.toString(),
    copy: payload.copy,
    autoCopy: payload.autoCopy,
    isArchive: payload.isArchive,
  };

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function readBarkConfigFromFile() {
  try {
    const configPath = join(__dirname, "..", "config", "bark.json");
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content);
    return config.configs.filter((c) => c.enabled);
  } catch (error) {
    console.error("Failed to read bark config file:", error);
    return [];
  }
}

// 读取bark配置
async function readBarkConfig() {
  const datasourceUrl =
    process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

  if (!datasourceUrl) {
    return readBarkConfigFromFile();
  }

  const prisma = new PrismaClient({ datasourceUrl });

  try {
    const configs = await prisma.barkConfig.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "asc" },
    });

    return configs;
  } catch (error) {
    console.error("Failed to read bark config from database:", error);
  } finally {
    await prisma.$disconnect();
  }

  return readBarkConfigFromFile();
}

// 发送bark通知
async function sendBarkNotification(config, payload) {
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: BARK_REQUEST_HEADERS,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✓ Notification sent to ${config.name}`);
      return true;
    } else {
      const responseText = await response.text().catch(() => "");
      console.error(
        `✗ Failed to send notification to ${config.name}: ${response.status} ${response.statusText}`,
        formatBarkErrorResponse(response.status, responseText),
      );

      if (isCloudflareChallenge(response.status, responseText)) {
        const fallbackResponse = await fetch(
          createBarkGetUrl(config.url, payload),
          {
            method: "GET",
            headers: BARK_REQUEST_HEADERS,
          },
        );

        if (fallbackResponse.ok) {
          console.log(`✓ Fallback notification sent to ${config.name}`);
          return true;
        }

        const fallbackResponseText = await fallbackResponse
          .text()
          .catch(() => "");
        console.error(
          `✗ Failed to send fallback notification to ${config.name}: ${fallbackResponse.status} ${fallbackResponse.statusText}`,
          formatBarkErrorResponse(
            fallbackResponse.status,
            fallbackResponseText,
          ),
        );
      }

      return false;
    }
  } catch (error) {
    console.error(
      `✗ Error sending notification to ${config.name}:`,
      error.message,
    );
    return false;
  }
}

// 主函数
async function main() {
  console.log("Starting build notification system...");

  // 读取配置
  const configs = await readBarkConfig();

  if (configs.length === 0) {
    console.warn("No enabled bark configs found. Skipping notification.");
    return;
  }

  console.log(`Found ${configs.length} enabled bark config(s)`);

  // 准备通知内容
  let title, body, sound;

  if (buildStatus === "success") {
    title = "🚀 [Next Build Success] 🎉";
    body = `🎉 **Build Status:** SUCCESS ✅\n\n🕒 **Build Time:** ${currentTime}\n\n🌐 **Server IP:** ${serverIp}\n\n✨ Congratulations! Your Next.js project has been successfully built! 🎊`;
    sound = "shake.caf";
  } else {
    title = "🚨 [Next Build Failed] ❌";
    body = `⚠️ **Build Status:** FAILED ❌\n\n🕒 **Failure Time:** ${currentTime}\n\n🌐 **Server IP:** ${serverIp}\n\n💥 Please check the logs and fix the issues. Good luck! 💪`;
    sound = "ladder.caf";
  }

  // 向所有启用的配置发送通知
  const results = await Promise.all(
    configs.map((config) =>
      sendBarkNotification(config, {
        body,
        title,
        sound,
        group: config.defaultGroup,
        category: config.defaultCategory,
        icon: config.defaultIcon,
      }),
    ),
  );

  // 检查结果
  const successCount = results.filter((r) => r).length;
  console.log(
    `Sent ${successCount}/${configs.length} notification(s) successfully`,
  );

  // 如果全部失败，退出码为1
  if (successCount === 0 && configs.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

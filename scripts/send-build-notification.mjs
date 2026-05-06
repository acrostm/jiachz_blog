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
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✓ Notification sent to ${config.name}`);
      return true;
    } else {
      console.error(
        `✗ Failed to send notification to ${config.name}: ${response.status}`,
      );
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
  let title, body, sound, key;

  if (buildStatus === "success") {
    title = "🚀 [Next Build Success] 🎉";
    body = `🎉 **Build Status:** SUCCESS ✅\n\n🕒 **Build Time:** ${currentTime}\n\n🌐 **Server IP:** ${serverIp}\n\n✨ Congratulations! Your Next.js project has been successfully built! 🎊`;
    sound = "shake.caf";
    key = "✅";
  } else {
    title = "🚨 [Next Build Failed] ❌";
    body = `⚠️ **Build Status:** FAILED ❌\n\n🕒 **Failure Time:** ${currentTime}\n\n🌐 **Server IP:** ${serverIp}\n\n💥 Please check the logs and fix the issues. Good luck! 💪`;
    sound = "ladder.caf";
    key = "❌";
  }

  // 向所有启用的配置发送通知
  const results = await Promise.all(
    configs.map((config) =>
      sendBarkNotification(config, {
        key,
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

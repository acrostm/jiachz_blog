/**
 * Bark配置管理服务
 * 支持从JSON文件读取和写入bark配置，支持热更新
 */

import fs from "fs/promises";
import path from "path";

export interface BarkConfigItem {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  defaultGroup: string;
  defaultCategory: string;
  defaultIcon: string;
  defaultSound: string;
  description?: string;
}

export interface BarkConfigFile {
  configs: BarkConfigItem[];
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "config", "bark.json");

// 内存缓存
let configCache: BarkConfigFile | null = null;
let lastReadTime = 0;
const CACHE_TTL = 5000; // 5秒缓存

/**
 * 读取bark配置文件
 */
export async function readBarkConfig(): Promise<BarkConfigFile> {
  const now = Date.now();

  // 使用缓存
  if (configCache && now - lastReadTime < CACHE_TTL) {
    return configCache;
  }

  try {
    const content = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const config = JSON.parse(content) as BarkConfigFile;

    // 验证配置格式
    if (!config.configs || !Array.isArray(config.configs)) {
      throw new Error("Invalid bark config format");
    }

    configCache = config;
    lastReadTime = now;

    return config;
  } catch (error) {
    // 如果文件不存在或解析失败，返回默认配置
    console.error("Failed to read bark config:", error);

    const defaultConfig: BarkConfigFile = {
      configs: [
        {
          id: "default",
          name: "默认通知",
          url: "https://bark.jiachz.com/xFAZhVwHM4vLEUgvg442m4/",
          enabled: true,
          defaultGroup: "Blog",
          defaultCategory: "通知",
          defaultIcon: "https://r2.jiachz.com/jiachz-light.svg",
          defaultSound: "default",
        },
      ],
    };

    return defaultConfig;
  }
}

/**
 * 写入bark配置文件
 */
export async function writeBarkConfig(config: BarkConfigFile): Promise<void> {
  try {
    // 确保目录存在
    const dir = path.dirname(CONFIG_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });

    // 写入文件
    await fs.writeFile(
      CONFIG_FILE_PATH,
      JSON.stringify(config, null, 2),
      "utf-8",
    );

    // 清除缓存
    configCache = null;
    lastReadTime = 0;
  } catch (error) {
    console.error("Failed to write bark config:", error);
    throw new Error("Failed to save bark configuration");
  }
}

/**
 * 获取所有启用的bark配置
 */
export async function getEnabledBarkConfigs(): Promise<BarkConfigItem[]> {
  const config = await readBarkConfig();
  return config.configs.filter((c) => c.enabled);
}

/**
 * 获取单个bark配置
 */
export async function getBarkConfigById(
  id: string,
): Promise<BarkConfigItem | null> {
  const config = await readBarkConfig();
  return config.configs.find((c) => c.id === id) ?? null;
}

/**
 * 添加新的bark配置
 */
export async function addBarkConfig(
  newConfig: Omit<BarkConfigItem, "id">,
): Promise<BarkConfigItem> {
  const config = await readBarkConfig();

  // 生成唯一ID
  const id = `bark_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const configItem: BarkConfigItem = {
    id,
    ...newConfig,
  };

  config.configs.push(configItem);
  await writeBarkConfig(config);

  return configItem;
}

/**
 * 更新bark配置
 */
export async function updateBarkConfig(
  id: string,
  updates: Partial<Omit<BarkConfigItem, "id">>,
): Promise<BarkConfigItem | null> {
  const config = await readBarkConfig();
  const index = config.configs.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  config.configs[index] = {
    ...config.configs[index],
    ...updates,
  };

  await writeBarkConfig(config);
  return config.configs[index];
}

/**
 * 删除bark配置
 */
export async function deleteBarkConfig(id: string): Promise<boolean> {
  const config = await readBarkConfig();
  const initialLength = config.configs.length;

  config.configs = config.configs.filter((c) => c.id !== id);

  if (config.configs.length === initialLength) {
    return false; // 没有找到要删除的配置
  }

  await writeBarkConfig(config);
  return true;
}

/**
 * 清除配置缓存
 */
export function clearBarkConfigCache(): void {
  configCache = null;
  lastReadTime = 0;
}

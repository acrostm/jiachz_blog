/**
 * Bark配置管理服务
 * 使用数据库持久化Bark配置，并从JSON文件提供首次迁移兜底
 */
import path from "path";

import { prisma } from "./prisma";

import fs from "fs/promises";

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

type StoredBarkConfigItem = Omit<BarkConfigItem, "description"> & {
  description?: string | null;
};

const CONFIG_FILE_PATH = path.join(process.cwd(), "config", "bark.json");
const DEFAULT_CONFIG: BarkConfigFile = {
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

// 内存缓存
let configCache: BarkConfigFile | null = null;
let lastReadTime = 0;
const CACHE_TTL = 5000; // 5秒缓存

const normalizeBarkConfigItem = (
  config: StoredBarkConfigItem,
): BarkConfigItem => ({
  id: config.id,
  name: config.name,
  url: config.url,
  enabled: config.enabled,
  defaultGroup: config.defaultGroup,
  defaultCategory: config.defaultCategory,
  defaultIcon: config.defaultIcon,
  defaultSound: config.defaultSound,
  description: config.description ?? undefined,
});

const stripUndefined = <T extends object>(data: T) => {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
};

const toBarkConfigUpdate = (item: BarkConfigItem) =>
  stripUndefined({
    name: item.name,
    url: item.url,
    enabled: item.enabled,
    defaultGroup: item.defaultGroup,
    defaultCategory: item.defaultCategory,
    defaultIcon: item.defaultIcon,
    defaultSound: item.defaultSound,
    description: item.description,
  });

async function readBarkConfigFile(): Promise<BarkConfigFile> {
  try {
    const content = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const config = JSON.parse(content) as BarkConfigFile;

    if (!config.configs || !Array.isArray(config.configs)) {
      throw new Error("Invalid bark config format");
    }

    return {
      configs: config.configs.map(normalizeBarkConfigItem),
    };
  } catch (error) {
    console.error("Failed to read bark config file:", error);
    return DEFAULT_CONFIG;
  }
}

async function seedBarkConfigs(config: BarkConfigFile): Promise<void> {
  if (!config.configs.length) {
    return;
  }

  await prisma.$transaction(
    config.configs.map((item) =>
      prisma.barkConfig.upsert({
        where: { id: item.id },
        create: item,
        update: toBarkConfigUpdate(item),
      }),
    ),
  );
}

/**
 * 读取bark配置
 */
export async function readBarkConfig(): Promise<BarkConfigFile> {
  const now = Date.now();

  // 使用缓存
  if (configCache && now - lastReadTime < CACHE_TTL) {
    return configCache;
  }

  try {
    const configs = await prisma.barkConfig.findMany({
      orderBy: { createdAt: "asc" },
    });

    const config: BarkConfigFile =
      configs.length > 0
        ? { configs: configs.map(normalizeBarkConfigItem) }
        : await readBarkConfigFile();

    if (configs.length === 0) {
      await seedBarkConfigs(config);
    }

    configCache = config;
    lastReadTime = now;

    return config;
  } catch (error) {
    console.error("Failed to read bark config from database:", error);
    return readBarkConfigFile();
  }
}

/**
 * 写入bark配置
 */
export async function writeBarkConfig(config: BarkConfigFile): Promise<void> {
  try {
    const ids = config.configs.map((item) => item.id);

    await prisma.$transaction([
      prisma.barkConfig.deleteMany({
        where: ids.length > 0 ? { id: { notIn: ids } } : {},
      }),
      ...config.configs.map((item) =>
        prisma.barkConfig.upsert({
          where: { id: item.id },
          create: item,
          update: toBarkConfigUpdate(item),
        }),
      ),
    ]);

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
  const existingConfig = config.configs[index];

  if (!existingConfig) {
    return null;
  }

  const updatedConfig: BarkConfigItem = {
    ...existingConfig,
    ...stripUndefined(updates),
  };

  config.configs[index] = updatedConfig;
  await writeBarkConfig(config);
  return updatedConfig;
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

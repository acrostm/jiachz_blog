import { prisma } from "./prisma";

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

    const config: BarkConfigFile = {
      configs: configs.map(normalizeBarkConfigItem),
    };

    configCache = config;
    lastReadTime = now;

    return config;
  } catch (error) {
    console.error("Failed to read bark config from database:", error);
    throw new Error("Failed to read bark configuration");
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
  // 生成唯一ID
  const id = `bark_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const configItem = await prisma.barkConfig.create({
    data: {
      id,
      ...newConfig,
    },
  });

  clearBarkConfigCache();
  return normalizeBarkConfigItem(configItem);
}

/**
 * 更新bark配置
 */
export async function updateBarkConfig(
  id: string,
  updates: Partial<Omit<BarkConfigItem, "id">>,
): Promise<BarkConfigItem | null> {
  const updateData = stripUndefined(updates);

  if (Object.keys(updateData).length === 0) {
    return getBarkConfigById(id);
  }

  try {
    const updatedConfig = await prisma.barkConfig.update({
      where: { id },
      data: updateData,
    });

    clearBarkConfigCache();
    return normalizeBarkConfigItem(updatedConfig);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return null;
    }

    throw error;
  }
}

/**
 * 删除bark配置
 */
export async function deleteBarkConfig(id: string): Promise<boolean> {
  try {
    await prisma.barkConfig.delete({
      where: { id },
    });

    clearBarkConfigCache();
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return false;
    }

    throw error;
  }
}

/**
 * 清除配置缓存
 */
export function clearBarkConfigCache(): void {
  configCache = null;
  lastReadTime = 0;
}

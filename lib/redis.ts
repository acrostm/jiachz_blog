import Redis, { type Redis as RedisInstanceType } from "ioredis";

import { KV_URL, NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config";

import { REDIS_KEY_PREFIX } from "@/constants";

const globalForRedis = global as unknown as { redis: RedisInstanceType | null };

/**
 * Creates a Redis instance prioritizing Vercel KV_URL.
 * If no configuration is available, returns a Proxy that throws errors
 * which are handled by the business logic's try/catch blocks.
 */
const createRedisInstance = () => {
  // 1. Prioritize Vercel KV (automatically injected in Vercel environment)
  if (KV_URL) {
    const instance = new Redis(KV_URL, {
      keyPrefix: REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 5,
      enableOfflineQueue: false,
    });

    instance.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Vercel KV redis error: ", err);
    });

    return instance;
  }

  // 2. Fallback to legacy/local REDIS_HOST (manual configuration or local dev)
  if (REDIS_HOST) {
    const instance = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
      password: REDIS_PASSWORD ?? "",
// 只有在配置了 KV_URL 或 REDIS_HOST 的情况下才创建真实的 Redis 实例
const createRedisInstance = () => {
  if (!KV_URL && !REDIS_HOST) {
    // 如果没有配置，返回一个 Proxy 对象，调用任何方法都会报错，但会被业务逻辑的 try/catch 捕获
    return new Proxy({} as RedisInstanceType, {
      get: () => {
        return () => {
          throw new Error("Redis host/URL is not configured. Skipping redis operation.");
        };
      },
    });
  }

  // 优先使用 Vercel KV 自动注入的连接字符串
  if (KV_URL) {
    const instance = new Redis(KV_URL, {
      keyPrefix: REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 5,
      enableOfflineQueue: false,
    });

    instance.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Vercel KV redis error: ", err);
    });

    return instance;
  }

  // 3. Silent Proxy Mode: For build-time or environments without Redis
  // Returns a proxy that throws an error on any call, which is then caught by business logic.
  return new Proxy({} as RedisInstanceType, {
    get: (target, prop) => {
      // Allow internal checks or methods that shouldn't crash
      if (prop === "on" || prop === "quit") return () => {};
      
      return () => {
        throw new Error(`Redis not configured. Skipping operation: ${String(prop)}`);
      };
    },
  // 降级使用原本的离线自建 Redis 配置
  const instance = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
    password: REDIS_PASSWORD ?? "",
    keyPrefix: REDIS_KEY_PREFIX,
    maxRetriesPerRequest: 5,
    enableOfflineQueue: false,
  });
};

  instance.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("redis error: ", err);
  });

  return instance;
};

export const redis = (globalForRedis.redis ?? createRedisInstance()) as RedisInstanceType;

if (NODE_ENV !== "production") globalForRedis.redis = redis;

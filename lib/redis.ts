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
      keyPrefix: REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 5,
      enableOfflineQueue: false,
    });

    instance.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("redis error: ", err);
    });

    return instance;
  }

  // 3. Silent Proxy Mode: For build-time or environments without Redis
  // Returns a proxy that throws an error on any call, which is then caught by business logic.
  return new Proxy({} as RedisInstanceType, {
    get: (target, prop) => {
      // Allow internal checks or methods that shouldn't crash
      if (prop === "on" || prop === "quit" || prop === "then") return () => {};
      
      return () => {
        throw new Error(`Redis not configured. Skipping operation: ${String(prop)}`);
      };
    },
  });
};

export const redis = (globalForRedis.redis ?? createRedisInstance()) as RedisInstanceType;

if (NODE_ENV !== "production") globalForRedis.redis = redis;

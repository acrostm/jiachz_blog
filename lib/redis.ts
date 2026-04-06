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
  try {
    // 1. Prioritize Vercel KV or Upstash URL (automatically injected in Vercel environment or integration)
    const redisUrl = KV_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
    
    if (redisUrl) {
      // ioredis automatically handles rediss:// for TLS
      const instance = new Redis(redisUrl, {
        keyPrefix: REDIS_KEY_PREFIX,
        maxRetriesPerRequest: 5,
        enableOfflineQueue: false,
        connectTimeout: 10000, // 10s timeout
      });

      instance.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.error("Vercel KV/Redis error: ", err);
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
        connectTimeout: 10000,
        // If it's a remote connection and not local, we might need TLS
        tls: REDIS_HOST !== "127.0.0.1" && REDIS_HOST !== "localhost" ? {} : undefined,
      });

      instance.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.error("redis error: ", err);
      });

      return instance;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize Redis client:", error);
  }

  // 3. Silent Proxy Mode: For build-time or environments without Redis
  // Returns a proxy that throws an error on any call, which is then caught by business logic.
  return new Proxy({} as RedisInstanceType, {
    get: (target, prop) => {
      // Allow internal checks or methods that shouldn't crash
      if (prop === "on" || prop === "quit" || prop === "then") return () => {};
      
      return () => {
        throw new Error(`Redis not configured. Missing KV_URL, REDIS_URL, or REDIS_HOST. Skipping operation: ${String(prop)}`);
      };
    },
  });
};

// Reuse connection in both dev and prod to avoid hitting connection limits in serverless
export const redis = (globalForRedis.redis || (globalForRedis.redis = createRedisInstance())) as RedisInstanceType;

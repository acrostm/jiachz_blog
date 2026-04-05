import Redis, { type Redis as RedisInstanceType } from "ioredis";

import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config";

import { REDIS_KEY_PREFIX } from "@/constants";

const globalForRedis = global as unknown as { redis: RedisInstanceType | null };

// 只有在配置了 REDIS_HOST 的情况下才创建真实的 Redis 实例
const createRedisInstance = () => {
  if (!REDIS_HOST) {
    // 如果没有配置 Host，返回一个 Proxy 对象，调用任何方法都会报错，但会被业务逻辑的 try/catch 捕获
    return new Proxy({} as RedisInstanceType, {
      get: () => {
        return () => {
          throw new Error("Redis host is not configured. Skipping redis operation.");
        };
      },
    });
  }

  const instance = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
    password: REDIS_PASSWORD ?? "",
    keyPrefix: REDIS_KEY_PREFIX,
    maxRetriesPerRequest: 5, // 正常运行时允许少量重试
    enableOfflineQueue: false, // 不堆积离线指令
  });

  instance.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("redis error: ", err);
  });

  return instance;
};

export const redis = (globalForRedis.redis ?? createRedisInstance()) as RedisInstanceType;

if (NODE_ENV !== "production") globalForRedis.redis = redis;

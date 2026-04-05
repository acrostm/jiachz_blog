import Redis, { type Redis as RedisInstanceType } from "ioredis";

import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config";

import { REDIS_KEY_PREFIX } from "@/constants";

const globalForRedis = global as unknown as { redis: RedisInstanceType };

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: REDIS_HOST || "",
    port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
    password: REDIS_PASSWORD ?? "",
    keyPrefix: REDIS_KEY_PREFIX,
    // 如果没有 host，直接设置为 0 次重试，让它报错而不是一直重试导致构建失败
    maxRetriesPerRequest: REDIS_HOST ? 20 : 0,
    // 允许在没有连接的情况下仍然能执行查询（虽然会报错，但不会阻塞）
    enableOfflineQueue: false,
  });

redis.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.log("redis error: ", err);
});

if (NODE_ENV !== "production") globalForRedis.redis = redis;

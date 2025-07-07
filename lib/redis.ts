import Redis, { type Redis as RedisInstanceType } from "ioredis";

import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config";

import { REDIS_KEY_PREFIX } from "@/constants";

const globalForRedis = global as unknown as { redis: RedisInstanceType };

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: REDIS_HOST ?? "127.0.0.1",
    port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
    password: REDIS_PASSWORD ?? "",
    keyPrefix: REDIS_KEY_PREFIX,
  });

redis.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.log("redis error: ", err);
});

if (NODE_ENV !== "production") globalForRedis.redis = redis;

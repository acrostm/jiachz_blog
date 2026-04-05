export const DATABASE_URL = process.env.DATABASE_URL;

// Vercel Postgres variables (automatically injected by Vercel Storage)
export const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;

export const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING;

// Vercel KV variables (automatically injected by Vercel Storage)
export const KV_URL = process.env.KV_URL;

// Optional legacy/local Redis variables
// export const KV_URL = process.env.KV_URL;

export const REDIS_HOST = process.env.REDIS_HOST;

export const REDIS_PORT = process.env.REDIS_PORT;

export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

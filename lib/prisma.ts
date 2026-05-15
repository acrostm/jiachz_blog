import { PrismaClient } from "@prisma/client";

import { DATABASE_URL, NODE_ENV, POSTGRES_PRISMA_URL } from "@/config";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prioritize POSTGRES_PRISMA_URL (Vercel pooled connection) over DATABASE_URL
const datasourceUrl = POSTGRES_PRISMA_URL ?? DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log:
      NODE_ENV === "development"
        ? // ? ['query', 'info', 'warn', 'error']
          ["warn", "error"]
        : undefined,
  });

if (NODE_ENV !== "production") globalForPrisma.prisma = prisma;

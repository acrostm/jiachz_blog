import { prisma } from "@/lib/prisma";

export async function getUserLinkedAccounts(userId?: string) {
  if (!userId) return [];
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      providerAccountId: true,
    },
  });
  return accounts;
}

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { IconBrandGithub } from "@/components/icons/fa6-brands";
import { IconLogoGoogle } from "@/components/icons/logos";

import { getUserLinkedAccounts } from "@/features/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  let userDb: { createdAt?: Date; lastLoginAt?: Date } | null = null;
  if (user?.id) {
    userDb = ((await prisma.user.findUnique({
      where: { id: user.id },
    })) ?? null) as { createdAt?: Date } | null;
  }
  // 获取已绑定的第三方账号
  const accounts = await getUserLinkedAccounts(user?.id);

  return (
    <div className="flex min-h-[30vh] flex-col items-center bg-background pb-8 pt-12">
      <div className="flex w-full max-w-lg flex-col items-center gap-8 p-4">
        <Avatar className="size-28 shadow-md">
          <AvatarImage
            src={user?.image || undefined}
            alt={user?.name || user?.email || "头像"}
          />
        </Avatar>
        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl font-bold">
            {user?.name || "未设置用户名"}
          </div>
          <div className="text-base text-gray-500">{user?.email}</div>
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <div className="self-start font-semibold">已绑定账号：</div>
          <div className="flex w-full flex-wrap gap-2">
            {accounts?.map(
              (acc: { provider: string; providerAccountId: string }) => (
                <Badge
                  key={acc.provider}
                  className="flex items-center gap-1 px-2 py-1 text-sm"
                >
                  {acc.provider === "github" && (
                    <IconBrandGithub className="text-lg" />
                  )}
                  {acc.provider === "google" && (
                    <IconLogoGoogle className="text-lg" />
                  )}
                  <span>
                    {acc.provider.charAt(0).toUpperCase() +
                      acc.provider.slice(1)}
                  </span>
                </Badge>
              ),
            )}
            {accounts?.length === 0 && (
              <span className="text-gray-400">无</span>
            )}
          </div>
        </div>
        <div className="mt-4 flex w-full flex-col gap-1 text-sm text-gray-500">
          <div>
            <span className="font-semibold text-gray-700">注册时间：</span>
            {userDb?.createdAt
              ? new Date(userDb.createdAt).toLocaleString()
              : "-"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">最近登录：</span>
            {userDb?.lastLoginAt
              ? new Date(userDb.lastLoginAt).toLocaleString()
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

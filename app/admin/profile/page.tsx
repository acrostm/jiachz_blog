import { Badge } from "@/components/ui/badge";

import { AvatarUpload } from "@/components/avatar-upload";
import { IconBrandGithub } from "@/components/icons/fa6-brands";
import { IconLogoGoogle } from "@/components/icons/logos";
import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { AdminContentLayout } from "@/features/admin";
import { getUserLinkedAccounts } from "@/features/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";

type LinkedAccount = {
  provider: string;
  providerAccountId: string;
};

type UserDbData = {
  createdAt?: Date;
  lastLoginAt?: Date;
};

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  let userDb: UserDbData | null = null;
  if (user?.id) {
    userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }
  const accounts: LinkedAccount[] = await getUserLinkedAccounts(user?.id);

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.SITE_PROFILE]}
        />
      }
    >
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-background p-6 shadow-sm">
          <AvatarUpload
            currentImage={user?.image}
            userName={user?.name}
            userEmail={user?.email}
          />
          <div className="text-xl font-semibold text-foreground">
            {user?.name ?? "未设置用户名"}
          </div>
          <div className="text-foreground">{user?.email}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 text-sm font-medium text-foreground">
              注册时间
            </div>
            <div className="text-foreground">
              {userDb?.createdAt
                ? new Date(userDb?.createdAt).toLocaleString()
                : "-"}
            </div>
            <div className="mb-2 mt-4 text-sm font-medium text-foreground">
              最近登录
            </div>
            <div className="text-foreground">
              {userDb?.lastLoginAt
                ? formatRelativeTime(userDb?.lastLoginAt)
                : "-"}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 text-sm font-medium text-foreground">
              已绑定账号
            </div>
            <div className="flex flex-wrap gap-2">
              {accounts.length > 0 ? (
                accounts.map((acc) => (
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
                ))
              ) : (
                <span className="text-foreground/60">无</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminContentLayout>
  );
}

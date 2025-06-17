import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS, PATHS_MAP, PLACEHOLDER_TEXT } from "@/constants";
import { AdminContentLayout } from "@/features/admin/components";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ChangePasswordForm } from "../components/change-password-form";

export const ProfilePage = async () => {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  });
  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_PROFILE]}
        />
      }
    >
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>个人信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="size-10">
                <AvatarImage
                  src={session.user.image ?? ""}
                  alt={session.user.name ?? PLACEHOLDER_TEXT}
                />
                <AvatarFallback>
                  {session.user.name ?? PLACEHOLDER_TEXT}
                </AvatarFallback>
              </Avatar>
              <span>{session.user.name ?? PLACEHOLDER_TEXT}</span>
            </div>
            <ChangePasswordForm userId={session.user.id} />
            <div>
              <p className="mb-2 font-medium">已连接的第三方登录:</p>
              <ul className="list-disc pl-6">
                {accounts.map((a) => (
                  <li key={a.provider}>{a.provider}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
};

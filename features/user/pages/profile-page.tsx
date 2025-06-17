import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { IconBrandGithub, IconLogoGoogle } from "@/components/icons";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS, PATHS_MAP, PLACEHOLDER_TEXT } from "@/constants";
import { AdminContentLayout } from "@/features/admin/components";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ChangePasswordForm } from "../components/change-password-form";
import { ChangeNameDialog } from "../components/change-name-dialog";

export const ProfilePage = async () => {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true, providerAccountId: true },
  });
  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_PROFILE]}
        />
      }
    >
      <div className="flex flex-col items-center space-y-6 px-4">
        <div className="space-y-2 text-center">
          <Avatar className="mx-auto size-20">
            <AvatarImage
              src={session.user.image ?? ""}
              alt={session.user.name ?? PLACEHOLDER_TEXT}
            />
            <AvatarFallback>
              {session.user.name ?? PLACEHOLDER_TEXT}
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-medium">
            {session.user.name ?? PLACEHOLDER_TEXT}
          </p>
          <p className="text-sm text-muted-foreground">
            {session.user.email}
          </p>
        </div>
        <ChangeNameDialog
          userId={session.user.id}
          defaultName={session.user.name ?? ""}
        />
        <ChangePasswordForm userId={session.user.id} />
        <div className="w-full">
          <p className="mb-2 font-medium">已连接的第三方登录:</p>
          <ul className="space-y-2 pl-2">
            {accounts.map((a) => (
              <li key={a.provider} className="flex items-center space-x-1">
                {a.provider === "github" && (
                  <IconBrandGithub className="size-4" />
                )}
                {a.provider === "google" && (
                  <IconLogoGoogle className="size-4" />
                )}
                <span>{a.providerAccountId}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminContentLayout>
  );
};

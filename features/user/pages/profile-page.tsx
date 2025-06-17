import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  IconBrandGithub,
  IconLogoGoogle,
  IconLogoKuma,
} from "@/components/icons";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS, PLACEHOLDER_TEXT } from "@/constants";
import { AdminContentLayout } from "@/features/admin/components";
import { auth } from "@/lib/auth";

import { ChangePasswordForm } from "../components/change-password-form";
import { ChangeNameForm } from "../components/change-name-form";
import { getUserAccounts } from "../actions";

export const ProfilePage = async () => {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const accounts = await getUserAccounts(session.user.id);
  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_PROFILE]}
        />
      }
    >
      <div className="mx-auto max-w-xl space-y-6 px-4">
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
        {session.user.email && (
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        )}
        <ChangeNameForm
          userId={session.user.id}
          defaultName={session.user.name ?? ""}
        />
        <ChangePasswordForm userId={session.user.id} />
        <div>
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
                {a.provider === "credentials" && (
                  <IconLogoKuma className="size-4" />
                )}
                <span>{session.user.email ?? PLACEHOLDER_TEXT}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminContentLayout>
  );
};

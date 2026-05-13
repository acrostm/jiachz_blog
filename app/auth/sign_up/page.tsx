import { type Metadata } from "next";
import Link from "next/link";

import { UserAuthForm } from "@/components/authentication/user-auth-form";

import { AuthExperienceShell } from "@/features/auth";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  return (
    <AuthExperienceShell mode="sign-up">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--future-ink)]">
            注册新账户
          </h1>
          <p className="text-sm leading-6 text-[var(--future-muted)]">
            输入你的邮箱创建新账户
          </p>
        </div>
        <UserAuthForm />
        <p className="px-2 text-center text-sm leading-6 text-[var(--future-muted)]">
          继续即表示你同意本站的{" "}
          <Link
            href="/coming-soon"
            className="text-[var(--future-cyan)] underline-offset-4 hover:underline"
          >
            服务条款
          </Link>{" "}
          和{" "}
          <Link
            href="/coming-soon"
            className="text-[var(--future-cyan)] underline-offset-4 hover:underline"
          >
            隐私政策
          </Link>
          。
        </p>
      </div>
    </AuthExperienceShell>
  );
}

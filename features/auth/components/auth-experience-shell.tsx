import React from "react";

import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { NextLink } from "@/components/next-link";

import { NICKNAME, WEBSITE } from "@/constants";

type AuthExperienceShellProps = React.PropsWithChildren<{
  mode: "sign-in" | "sign-up";
}>;

export const AuthExperienceShell = ({
  children,
  mode,
}: AuthExperienceShellProps) => {
  const isSignUp = mode === "sign-up";

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-screen-xl items-center justify-between">
        <NextLink
          href="/"
          className="future-control-glass inline-flex items-center gap-3 rounded-full px-3 py-2"
          aria-label={NICKNAME}
        >
          <span className="grid size-8 place-items-center rounded-full border border-[var(--future-line)] bg-white/10">
            <Logo />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-[var(--future-ink)]">
            {WEBSITE}
          </span>
        </NextLink>
        <ModeToggle />
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-screen-xl items-center gap-8 py-10 lg:grid-cols-[minmax(340px,0.78fr)_minmax(420px,1fr)]">
        <section className="future-glass-strong relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/20" />
          {children}
        </section>

        <aside className="future-glass relative hidden min-h-[560px] overflow-hidden rounded-[2.25rem] p-8 lg:block">
          <video
            src="https://r2.jiachz.com/sign-in-page-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 size-full object-cover opacity-30 grayscale dark:opacity-25"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_14%,var(--future-accent-soft),transparent_24rem),radial-gradient(circle_at_86%_62%,var(--future-cyan-soft),transparent_22rem),linear-gradient(140deg,var(--future-panel-strong),transparent)]" />
          <div className="relative z-[1] flex h-full flex-col justify-between">
            <div className="space-y-5">
              <p className="future-label">
                {isSignUp ? "Identity setup" : "Access console"}
              </p>
              <h2 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-normal text-[var(--future-ink)] xl:text-5xl">
                {isSignUp
                  ? "建立一个更稳定的创作身份。"
                  : "回到你的创作控制台。"}
              </h2>
              <p className="max-w-md text-base leading-8 text-[var(--future-muted)]">
                {isSignUp
                  ? "设置账户、头像和基础资料后，就可以进入自己的博客工作区。"
                  : "管理文章、留言与个人资料，从一个安静清晰的入口开始。"}
              </p>
            </div>

            <div className="grid gap-3">
              {[
                ["01", isSignUp ? "profile" : "session"],
                ["02", isSignUp ? "avatar" : "oauth"],
                ["03", isSignUp ? "verified" : "admin"],
              ].map(([index, label]) => (
                <div
                  key={label}
                  className="future-control-glass flex items-center justify-between rounded-2xl px-4 py-3"
                >
                  <span className="font-mono text-xs text-[var(--future-muted)]">
                    {index}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--future-ink)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

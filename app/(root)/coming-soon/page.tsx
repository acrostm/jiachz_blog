import React from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { IllustrationIdle } from "@/components/illustrations";

import { PATHS } from "@/constants";

export default function Page() {
  return (
    <div className="grid min-h-[calc(100vh-190px)] place-items-center px-4 py-10">
      <div className="future-glass-strong grid max-w-xl gap-8 rounded-[2rem] px-6 py-10 sm:px-10">
        <IllustrationIdle className="size-[320px]" />
        <h3 className="text-center text-2xl font-semibold tracking-tight text-[var(--future-ink)]">
          页面开发中……🚧
        </h3>
        <p className="mx-auto max-w-md text-center text-lg leading-8 text-[var(--future-muted)]">
          We&apos;re working hard to bring you something amazing. Stay tuned for
          exciting updates!
        </p>
        <div className="flex justify-center space-x-4">
          <div className="animate-bounce">🚀</div>
          <div className="animate-bounce delay-100">🛠️</div>
          <div className="animate-bounce delay-200">💡</div>
        </div>
        <Button asChild>
          <Link href={PATHS.SITE_HOME}>返回首页</Link>
        </Button>
      </div>
    </div>
  );
}

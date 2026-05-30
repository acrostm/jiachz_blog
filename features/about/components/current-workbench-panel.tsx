"use client";

import React from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  Braces,
  Clock3,
  Code2,
  Globe2,
  Laptop,
  MessageSquareText,
  Newspaper,
  Radio,
  Rss,
  Terminal,
} from "lucide-react";

import { PATHS, SOURCE_CODE_GITHUB_PAGE } from "@/constants";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    label: "文章",
    value: "Blog",
    href: PATHS.SITE_BLOG,
    icon: Newspaper,
  },
  {
    label: "信号",
    value: "News",
    href: PATHS.SITE_NEWS,
    icon: Rss,
  },
  {
    label: "留言",
    value: "Message",
    href: PATHS.SITE_MESSAGES,
    icon: MessageSquareText,
  },
  {
    label: "源码",
    value: "Source",
    href: SOURCE_CODE_GITHUB_PAGE,
    icon: Braces,
    external: true,
  },
];

const STATIC_ROWS = [
  {
    label: "OS",
    value: "macOS / local dev",
    icon: Laptop,
  },
  {
    label: "Editors",
    value: "Codex + VS Code",
    icon: Code2,
  },
  {
    label: "Shell",
    value: "zsh",
    icon: Terminal,
  },
  {
    label: "Stack",
    value: "Next.js 15 / React 19",
    icon: Radio,
  },
];

export const CurrentWorkbenchPanel = () => {
  const [clock, setClock] = React.useState("syncing");
  const [timezone, setTimezone] = React.useState("Asia/Shanghai");

  React.useEffect(() => {
    const resolvedTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";

    function updateClock() {
      setClock(
        new Intl.DateTimeFormat("zh-CN", {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: false,
        }).format(new Date()),
      );
      setTimezone(resolvedTimezone);
    }

    updateClock();
    const interval = window.setInterval(updateClock, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside
      data-about-hero
      className="future-panel-strong relative isolate overflow-hidden rounded-[2rem] p-5 md:p-6"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,var(--future-cyan-soft),transparent_20rem),radial-gradient(circle_at_88%_76%,var(--future-accent-soft),transparent_20rem)]" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="flex items-start justify-between gap-4 border-b border-[var(--future-line)] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-cyan)]">
            <Laptop className="size-4" />
          </span>
          <div>
            <p className="future-label">当前工作台</p>
            <h2 className="mt-1 text-lg font-black text-[var(--future-ink)]">
              local signal panel
            </h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          在线
        </span>
      </div>

      <dl className="mt-5 grid gap-3">
        {STATIC_ROWS.map((row) => {
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[var(--future-line)] bg-black/[0.08] px-3 py-2.5 dark:bg-black/20"
            >
              <dt className="flex items-center gap-2 font-mono text-xs text-[var(--future-accent)]">
                <Icon className="size-3.5" />
                {row.label}
              </dt>
              <dd className="truncate font-mono text-xs text-[var(--future-ink)]">
                {row.value}
              </dd>
            </div>
          );
        })}

        <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[var(--future-line)] bg-black/[0.08] px-3 py-2.5 dark:bg-black/20">
          <dt className="flex items-center gap-2 font-mono text-xs text-[var(--future-accent)]">
            <Clock3 className="size-3.5" />
            Time
          </dt>
          <dd className="truncate font-mono text-xs text-[var(--future-ink)]">
            {clock}
          </dd>
        </div>

        <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[var(--future-line)] bg-black/[0.08] px-3 py-2.5 dark:bg-black/20">
          <dt className="flex items-center gap-2 font-mono text-xs text-[var(--future-accent)]">
            <Globe2 className="size-3.5" />
            Zone
          </dt>
          <dd className="truncate font-mono text-xs text-[var(--future-ink)]">
            Earth / {timezone}
          </dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className={cn(
                "group rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-3 transition duration-200",
                "hover:-translate-y-0.5 hover:border-[var(--future-accent)] hover:bg-white/[0.08]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-xl border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-accent)]">
                  <Icon className="size-4" />
                </span>
                <ArrowUpRight className="size-3.5 text-[var(--future-muted)] group-hover:text-[var(--future-accent)]" />
              </div>
              <p className="future-muted mt-3 font-mono text-[0.65rem] uppercase tracking-[0.18em]">
                {link.value}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--future-ink)]">
                {link.label}
              </p>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

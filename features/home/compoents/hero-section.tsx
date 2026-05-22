"use client";

import React from "react";

import Link from "next/link";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ArrowUpRight,
  Braces,
  Cpu,
  Gamepad2,
  Newspaper,
  Rss,
  Sparkles,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { NICKNAME, PATHS } from "@/constants";
import { cn } from "@/lib/utils";

import { socialMediaList } from "./social-media";

gsap.registerPlugin(useGSAP);

export const HeroSection = () => {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set("[data-hero-reveal]", { autoAlpha: 1 });
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power3.out", duration: 0.85 } })
        .fromTo(
          "[data-hero-reveal]",
          { autoAlpha: 0, y: 28, filter: "blur(12px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            stagger: 0.08,
          },
        )
        .fromTo(
          "[data-hero-orbit]",
          { autoAlpha: 0, scale: 0.92, rotate: -8 },
          { autoAlpha: 1, scale: 1, rotate: 0 },
          "-=0.45",
        );

      gsap.to("[data-hero-orbit]", {
        y: -12,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-screen-2xl items-center gap-12 px-6 py-16 md:grid-cols-[minmax(0,1fr)_minmax(340px,480px)] md:px-10 lg:px-16"
    >
      <div className="max-w-4xl">
        <div data-hero-reveal className="mb-8 flex items-center gap-3">
          <span className="future-label">Jiach / Digital Field Notes</span>
          <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
        </div>

        <h1
          data-hero-reveal
          className="future-heading max-w-5xl text-6xl font-black leading-[0.92] md:text-8xl lg:text-9xl"
        >
          写给 AI 时代的软件开发现场
        </h1>

        <p
          data-hero-reveal
          className="future-muted mt-8 max-w-2xl text-lg leading-8 md:text-xl"
        >
          你好，我是 {NICKNAME}。这里记录工程实践、系统设计、工具链、AI
          协作和那些真正改变开发效率的细节。
        </p>

        <div data-hero-reveal className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href={PATHS.SITE_BLOG}
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 rounded-full bg-[var(--future-accent)] px-6 text-white hover:bg-[var(--future-accent)]/90",
            )}
          >
            进入博客
            <ArrowUpRight className="ml-2 size-4" />
          </Link>
          <Link
            href={PATHS.SITE_NEWS}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-full border-[var(--future-line)] bg-white/[0.06] px-6 text-[var(--future-ink)] hover:border-[var(--future-accent)] hover:bg-white/[0.12]",
            )}
          >
            <Rss className="mr-2 size-4 text-[var(--future-accent)]" />
            查看今日信号
          </Link>
          <Link
            href={PATHS.SITE_ABOUT}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-full border-[var(--future-line)] bg-white/[0.04] px-6 text-[var(--future-ink)] hover:bg-white/[0.08]",
            )}
          >
            关于我
          </Link>
        </div>

        <ul data-hero-reveal className="mt-10 flex flex-wrap gap-3">
          {socialMediaList.map((el) => (
            <li key={el.link}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="rounded-full border-[var(--future-line)] bg-white/[0.04] text-[var(--future-ink)] hover:bg-white/[0.08]"
                  >
                    <Link href={el.link} target="_blank" rel="noreferrer">
                      {el.icon}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{el.label}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </div>

      <div
        data-hero-orbit
        className="future-panel relative min-h-[520px] overflow-hidden rounded-[2rem] p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_15%,rgb(223_114_69/0.22),transparent_32%),radial-gradient(circle_at_80%_70%,rgb(34_211_238/0.18),transparent_28%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative z-[1] flex h-full min-h-[470px] flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="future-label">Live Stack</div>
            <div className="font-mono text-sm text-[var(--future-muted)]">
              01 / 06
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { icon: Cpu, label: "Backend Systems", value: "Java / Spring" },
              { icon: Braces, label: "Frontend Craft", value: "React / Next" },
              { icon: Sparkles, label: "AI Workflow", value: "Agentic Dev" },
              {
                icon: Rss,
                label: "News Signal",
                value: "Hot Feeds / Saved Reads",
                href: PATHS.SITE_NEWS,
              },
              {
                icon: Gamepad2,
                label: "Steam Prices",
                value: "Regional Price Radar",
                href: PATHS.SITE_STEAM_PRICES,
              },
              { icon: Newspaper, label: "Writing", value: "Notes / Essays" },
            ].map((item) => {
              const Icon = item.icon;
              const href = "href" in item ? item.href : undefined;
              const content = (
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-[var(--future-accent)]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--future-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-lg font-semibold">
                      {item.value}
                    </p>
                  </div>
                  {href && (
                    <ArrowUpRight className="size-4 text-[var(--future-muted)] transition-colors group-hover:text-[var(--future-accent)]" />
                  )}
                </div>
              );

              return href ? (
                <Link
                  key={item.label}
                  href={href}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-4 shadow-inner backdrop-blur transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[var(--future-accent)] hover:bg-black/25"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-inner backdrop-blur"
                >
                  {content}
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="future-muted text-sm leading-6">
              每篇文章都尽量保留代码、上下文、取舍和可回看的视觉记忆。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

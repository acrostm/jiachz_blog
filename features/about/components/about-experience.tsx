"use client";

import React from "react";

import Link from "next/link";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  Boxes,
  Compass,
  HeartHandshake,
  MessageSquareText,
  Rocket,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { GITHUB_PAGE, NICKNAME, PATHS } from "@/constants";
import { socialMediaList } from "@/features/home";
import { cn } from "@/lib/utils";

import { AboutMessageComposer } from "./about-message-composer";
import { CurrentWorkbenchPanel } from "./current-workbench-panel";
import { GithubUpdatePlate } from "./github-update-plate";
import { SkillConstellation } from "./skill-constellation";

import { type AboutSiteStats } from "../types";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HERO_ACTIONS = [
  { label: "持续学习", icon: Compass },
  { label: "构建", icon: Rocket },
  { label: "分享", icon: HeartHandshake },
];

type AboutExperienceProps = {
  siteStats: AboutSiteStats;
};

export const AboutExperience = ({ siteStats }: AboutExperienceProps) => {
  const scope = React.useRef<HTMLDivElement>(null);
  const heroStats = getHeroStats(siteStats);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const heroItems = gsap.utils.toArray<HTMLElement>("[data-about-hero]");
      const revealItems = gsap.utils.toArray<HTMLElement>(
        "[data-about-reveal]",
      );

      if (reduceMotion) {
        gsap.set([...heroItems, ...revealItems], {
          clearProps: "opacity,visibility,transform,filter",
        });
        return;
      }

      gsap
        .timeline({ defaults: { duration: 0.85, ease: "power3.out" } })
        .fromTo(
          heroItems,
          { y: 26, filter: "blur(12px)" },
          { y: 0, filter: "blur(0px)", stagger: 0.07 },
        );

      revealItems.forEach((item, index) => {
        gsap.fromTo(
          item,
          { y: 32, filter: "blur(14px)" },
          {
            y: 0,
            filter: "blur(0px)",
            duration: 0.95,
            delay: Math.min(index * 0.04, 0.18),
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 86%",
              once: true,
            },
          },
        );
      });

      gsap.delayedCall(1.4, () => {
        gsap.set([...heroItems, ...revealItems], {
          clearProps: "opacity,visibility",
        });
      });

      gsap.to("[data-about-float]", {
        y: -12,
        rotate: 0.8,
        duration: 4.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 pb-24 pt-8 sm:px-6 md:px-10 lg:px-12"
    >
      <section className="relative grid gap-8 overflow-hidden py-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.46fr)] lg:items-center lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full opacity-60 [background-image:radial-gradient(circle_at_32%_12%,var(--future-cyan-soft),transparent_32rem),radial-gradient(circle_at_62%_46%,var(--future-accent-soft),transparent_28rem)]" />
        <div className="max-w-4xl">
          <div data-about-hero className="mb-6 flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-[var(--future-accent)]">
              $ whoami
            </span>
            <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
          </div>

          <h1
            data-about-hero
            className="future-heading max-w-5xl font-mono text-6xl font-black leading-[0.9] md:text-8xl lg:text-9xl"
          >
            {NICKNAME}
            <Link
              href={PATHS.SITE_TUI}
              aria-label="打开隐藏终端页面"
              title="run ./secret"
              className="ml-1 inline-block rounded-sm align-baseline outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--future-accent)]"
            >
              <span
                aria-hidden="true"
                className="block h-[0.78em] w-2 translate-y-2 bg-[var(--future-accent)] motion-safe:animate-pulse md:w-3"
              />
            </Link>
          </h1>

          <p
            data-about-hero
            className="mt-5 font-mono text-xl font-semibold text-[var(--future-cyan)] md:text-2xl"
          >
            Full-Stack Developer
          </p>

          <p
            data-about-hero
            className="future-muted mt-5 max-w-2xl text-base leading-8 md:text-lg"
          >
            用代码构建可持续的产品与体验。在技术与业务之间，寻找最优解。
          </p>

          <div
            data-about-hero
            className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3"
          >
            {heroStats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--future-line)] bg-white/[0.04] px-4 py-3 shadow-[var(--future-inner)] backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-[var(--future-accent)]">
                    <Icon className="size-4" />
                    <span className="font-mono text-2xl font-black tabular-nums text-[var(--future-ink)]">
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--future-ink)]">
                    {item.label}
                  </p>
                  <p className="future-muted mt-1 truncate font-mono text-[0.68rem] uppercase tracking-[0.14em]">
                    {item.caption}
                  </p>
                </div>
              );
            })}
          </div>

          {siteStats.status !== "live" && (
            <p
              data-about-hero
              className="future-muted mt-3 max-w-2xl text-xs leading-5"
            >
              文章数来自数据库，独立项目数来自 GitHub public
              repos；当前有数据源未响应时会显示占位。
            </p>
          )}

          <div
            data-about-hero
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Link
              href={PATHS.SITE_MESSAGES}
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 rounded-full bg-[var(--future-accent)] px-6 text-white hover:bg-[var(--future-accent)]/90",
              )}
            >
              给我留言
              <MessageSquareText className="ml-2 size-4" />
            </Link>
            <Link
              href={GITHUB_PAGE}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 rounded-full border-[var(--future-line)] bg-white/[0.04] px-6 text-[var(--future-ink)] hover:border-[var(--future-cyan)] hover:bg-white/[0.08]",
              )}
            >
              GitHub Profile
              <ArrowUpRight className="ml-2 size-4" />
            </Link>
          </div>

          <div data-about-hero className="mt-6 flex max-w-2xl flex-wrap gap-3">
            {HERO_ACTIONS.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  key={item.label}
                  className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-full border border-[var(--future-line)] bg-white/[0.04] px-4 font-mono text-xs font-semibold text-[var(--future-ink)] transition hover:border-[var(--future-cyan)] hover:bg-white/[0.08]"
                >
                  <Icon className="size-3.5 text-[var(--future-accent)]" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div data-about-float>
          <CurrentWorkbenchPanel />
        </div>
      </section>

      <GithubUpdatePlate />

      <SkillConstellation />

      <AboutMessageComposer />

      <section
        data-about-reveal
        className="flex flex-col gap-5 rounded-[2rem] border border-[var(--future-line)] bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between md:p-6"
      >
        <div>
          <p className="future-label mb-2">Contact Links</p>
          <h2 className="text-2xl font-black text-[var(--future-ink)]">
            也可以从这些地方找到我
          </h2>
        </div>

        <ul className="flex flex-wrap gap-3">
          {socialMediaList.map((item) => (
            <li key={item.link}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="rounded-full border-[var(--future-line)] bg-white/[0.04] text-[var(--future-ink)] hover:bg-white/[0.08]"
                  >
                    <Link href={item.link} target="_blank" rel="noreferrer">
                      {item.icon}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{item.label}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

function getHeroStats(siteStats: AboutSiteStats) {
  return [
    {
      label: "开发经验",
      value: `${siteStats.experienceYears}+`,
      caption: "years in practice",
      icon: BadgeCheck,
    },
    {
      label: "独立项目",
      value: formatHeroCount(siteStats.projectCount, { suffix: "+" }),
      caption: "public repos",
      icon: Boxes,
    },
    {
      label: "当前文章",
      value: formatHeroCount(siteStats.articleCount),
      caption: "published posts",
      icon: BookOpenText,
    },
  ];
}

function formatHeroCount(
  value: number | undefined,
  options: { suffix?: string } = {},
) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value}${options.suffix ?? ""}`;
}

"use client";

import React from "react";

import Image from "next/image";
import Link from "next/link";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  ArrowUpRight,
  CircuitBoard,
  Cpu,
  DatabaseZap,
  ImageIcon,
  Layers3,
  Magnet,
  MousePointer2,
  ScanLine,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { PATHS } from "@/constants";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Physics2DPlugin);

type MaskImageStyle = React.CSSProperties & {
  "--mask-size": string;
};

const sequenceFrames = [
  {
    src: "/images/home-showcase/sequence-circuit.jpg",
    title: "Silicon Trace",
    label: "Frame 01",
    copy: "从芯片、电路和约束开始，把每一次设计决策落到可验证的底层信号里。",
  },
  {
    src: "/images/home-showcase/sequence-datacenter.jpg",
    title: "Runtime Aisle",
    label: "Frame 02",
    copy: "服务被放进真实运行环境，观察吞吐、缓存、队列和那些不会写进需求里的边界。",
  },
  {
    src: "/images/home-showcase/sequence-orbit.jpg",
    title: "Global Signal",
    label: "Frame 03",
    copy: "从单点实现切到全局视角，让信息、产品和工程判断跨时区流动。",
  },
  {
    src: "/images/home-showcase/sequence-ops.jpg",
    title: "Code Surface",
    label: "Frame 04",
    copy: "回到编辑器，把假设变成代码，把代码变成可以持续演进的系统。",
  },
  {
    src: "/images/home-showcase/mask-lab.jpg",
    title: "Agent Field",
    label: "Frame 05",
    copy: "最后把 AI 协作纳入工作台，筛选信号、生成草案、验证路径，再交给人做判断。",
  },
];

const signalCards = [
  {
    icon: CircuitBoard,
    title: "架构笔记",
    text: "把系统拆开看，再写回可复用的工程判断。",
  },
  {
    icon: DatabaseZap,
    title: "数据与反馈",
    text: "记录读者、部署、新闻流和工具链的真实反馈。",
  },
  {
    icon: Terminal,
    title: "开发现场",
    text: "保留命令、错误、权衡和最终落地的版本。",
  },
];

const physicsTokens = [
  "Prompt",
  "RAG",
  "Deploy",
  "Observability",
  "Cache",
  "Queue",
  "Latency",
  "Security",
];

const maskStyle: MaskImageStyle = {
  "--mask-size": "18%",
  WebkitMaskImage:
    "radial-gradient(circle at 50% 52%, black var(--mask-size), transparent calc(var(--mask-size) + 10%))",
  maskImage:
    "radial-gradient(circle at 50% 52%, black var(--mask-size), transparent calc(var(--mask-size) + 10%))",
};

export const ShowcaseSection = () => {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;

      if (!root) {
        return;
      }

      const revealItems = gsap.utils.toArray<HTMLElement>(
        "[data-showcase-reveal]",
      );
      const splitTargets = gsap.utils.toArray<HTMLElement>(
        "[data-showcase-split]",
      );
      const sequenceFramesElements = gsap.utils.toArray<HTMLElement>(
        "[data-sequence-frame]",
      );
      const sequenceCaptions = gsap.utils.toArray<HTMLElement>(
        "[data-sequence-caption]",
      );
      const sequenceShell = root.querySelector<HTMLElement>(
        "[data-sequence-shell]",
      );
      const sequenceStage = root.querySelector<HTMLElement>(
        "[data-sequence-stage]",
      );
      const physicsLab = root.querySelector<HTMLElement>("[data-physics-lab]");
      const physicsTokensElements = gsap.utils.toArray<HTMLElement>(
        "[data-physics-token]",
      );
      const physicsSparks = gsap.utils.toArray<HTMLElement>(
        "[data-physics-spark]",
      );
      const maskVisual = root.querySelector<HTMLElement>("[data-mask-visual]");
      const maskCopy = root.querySelector<HTMLElement>("[data-mask-copy]");
      const splitInstances: SplitText[] = [];

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(
          [
            ...revealItems,
            ...splitTargets,
            ...sequenceFramesElements,
            ...sequenceCaptions,
            ...physicsTokensElements,
            maskVisual,
            maskCopy,
          ].filter(Boolean),
          {
            autoAlpha: 1,
            clearProps: "transform,filter,clipPath",
          },
        );
        return;
      }

      revealItems.forEach((item, index) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 30, filter: "blur(14px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            delay: Math.min(index * 0.035, 0.18),
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 86%",
              once: true,
            },
          },
        );
      });

      splitTargets.forEach((target) => {
        const split = SplitText.create(target, {
          type: "chars",
          mask: "chars",
          charsClass: "home-showcase-char",
          aria: "auto",
        });

        splitInstances.push(split);

        gsap.from(split.chars, {
          autoAlpha: 0,
          yPercent: 120,
          rotateX: -74,
          transformOrigin: "50% 100%",
          duration: 0.78,
          ease: "power3.out",
          stagger: 0.018,
          scrollTrigger: {
            trigger: target,
            start: "top 82%",
            once: true,
          },
        });
      });

      if (sequenceShell && sequenceStage && sequenceFramesElements.length > 0) {
        const isNarrowViewport =
          window.matchMedia("(max-width: 767px)").matches;

        gsap.set(sequenceFramesElements, {
          autoAlpha: 0,
          scale: 1.08,
          filter: "saturate(0.8) contrast(1.1)",
        });
        gsap.set(sequenceCaptions, { autoAlpha: 0, y: 18 });

        if (!isNarrowViewport) {
          ScrollTrigger.create({
            trigger: sequenceShell,
            start: "top top+=64",
            end: () => `+=${window.innerHeight * 2.4}`,
            pin: sequenceStage,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });
        }

        gsap.fromTo(
          "[data-sequence-overlay]",
          { xPercent: -22, autoAlpha: 0.18 },
          {
            xPercent: 20,
            autoAlpha: 0.42,
            ease: "none",
            scrollTrigger: {
              trigger: sequenceShell,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (physicsLab) {
        gsap.fromTo(
          physicsTokensElements,
          {
            autoAlpha: 0,
            y: 64,
            rotate: () => gsap.utils.random(-15, 15),
            scale: 0.86,
          },
          {
            autoAlpha: 1,
            y: 0,
            rotate: 0,
            scale: 1,
            duration: 1.2,
            ease: "elastic.out(1, 0.62)",
            immediateRender: false,
            stagger: 0.055,
            scrollTrigger: {
              trigger: physicsLab,
              start: "top 72%",
              once: true,
            },
          },
        );

        gsap.set(physicsSparks, {
          x: 0,
          y: 0,
          autoAlpha: 0,
          scale: () => gsap.utils.random(0.5, 1.25),
        });

        ScrollTrigger.create({
          trigger: physicsLab,
          start: "top 66%",
          onEnter: () => {
            gsap.set(physicsSparks, {
              x: 0,
              y: 0,
              autoAlpha: 1,
              scale: () => gsap.utils.random(0.55, 1.35),
            });
            gsap.to(physicsSparks, {
              duration: () => gsap.utils.random(1.1, 1.9),
              autoAlpha: 0,
              physics2D: {
                velocity: () => gsap.utils.random(180, 520),
                angle: () => gsap.utils.random(200, 340),
                gravity: 520,
                friction: 0.12,
              },
              stagger: 0.008,
              overwrite: true,
            });
          },
        });
      }

      if (maskCopy) {
        gsap.fromTo(
          maskCopy,
          { autoAlpha: 0, y: 34, filter: "blur(14px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: maskCopy,
              start: "top 82%",
              once: true,
            },
          },
        );
      }

      return () => {
        splitInstances.forEach((split) => split.revert());
      };
    },
    { scope },
  );

  React.useEffect(() => {
    const root = scope.current;

    if (!root) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return;
    }

    const syncSequence = () => {
      const sequenceShell = root.querySelector<HTMLElement>(
        "[data-sequence-shell]",
      );
      const sequenceProgress = root.querySelector<HTMLElement>(
        "[data-sequence-progress]",
      );
      const frames = Array.from(
        root.querySelectorAll<HTMLElement>("[data-sequence-frame]"),
      );
      const captions = Array.from(
        root.querySelectorAll<HTMLElement>("[data-sequence-caption]"),
      );

      if (sequenceShell && sequenceProgress && frames.length > 0) {
        const start =
          sequenceShell.getBoundingClientRect().top + window.scrollY - 64;
        const end = start + window.innerHeight * 2.4;
        const progress = Math.min(
          1,
          Math.max(0, (window.scrollY - start) / (end - start)),
        );
        const activeFrame = Math.round(progress * (frames.length - 1));

        frames.forEach((frame, index) => {
          const isActive = index === activeFrame;

          frame.style.opacity = isActive ? "1" : "0";
          frame.style.visibility = isActive ? "visible" : "hidden";
          frame.style.transform = `scale(${isActive ? 1 : 1.08})`;
          frame.style.filter = isActive
            ? "saturate(1.05) contrast(1.08)"
            : "saturate(0.8) contrast(1.1)";
        });

        captions.forEach((caption, index) => {
          const isActive = index === activeFrame;

          caption.style.opacity = isActive ? "1" : "0";
          caption.style.visibility = isActive ? "visible" : "hidden";
          caption.style.transform = `translateY(${isActive ? 0 : 18}px)`;
        });

        sequenceProgress.style.transformOrigin = "0% 50%";
        sequenceProgress.style.transform = `scaleX(${progress})`;
      }

      const maskVisual = root.querySelector<HTMLElement>("[data-mask-visual]");

      if (maskVisual) {
        const maskRect = maskVisual.getBoundingClientRect();
        const start = maskRect.top + window.scrollY - window.innerHeight * 0.78;
        const end =
          maskRect.bottom + window.scrollY - window.innerHeight * 0.38;
        const progress = Math.min(
          1,
          Math.max(0, (window.scrollY - start) / (end - start)),
        );
        const maskSize = 18 + progress * 94;

        maskVisual.style.setProperty("--mask-size", `${maskSize}%`);
        maskVisual.style.transform = `scale(${1.08 - progress * 0.08})`;
      }
    };

    const syncSequenceInterval = window.setInterval(syncSequence, 80);

    window.addEventListener("scroll", syncSequence, { passive: true });
    window.addEventListener("resize", syncSequence);
    syncSequence();

    return () => {
      window.removeEventListener("scroll", syncSequence);
      window.removeEventListener("resize", syncSequence);
      window.clearInterval(syncSequenceInterval);
    };
  }, []);

  return (
    <div ref={scope} className="relative overflow-x-clip pb-24">
      <section className="mx-auto w-full max-w-screen-2xl px-6 pt-24 md:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,0.45fr)] lg:items-end">
          <div data-showcase-reveal>
            <div className="mb-6 flex items-center gap-3">
              <span className="future-label">Scroll Lab / GSAP Showcase</span>
              <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
            </div>
            <h2
              data-showcase-split
              className="future-heading max-w-5xl text-4xl font-black leading-[0.98] md:text-6xl lg:text-7xl"
            >
              把开发过程做成一条可滚动的信号链
            </h2>
            <p className="future-muted mt-6 max-w-3xl text-base leading-8 md:text-lg">
              首屏负责定调，往下则进入更具现场感的工程叙事：硬件、运行环境、全球信号、代码表面和
              AI 协作依次被滚动推进。
            </p>
          </div>

          <div
            data-showcase-reveal
            className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"
          >
            {signalCards.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="future-card rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-accent)]">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--future-ink)]">
                        {item.title}
                      </p>
                      <p className="future-muted mt-1 text-xs leading-5">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        data-sequence-shell
        className="mx-auto mt-14 min-h-[260vh] w-full max-w-screen-2xl px-3 md:px-8 lg:px-12"
      >
        <div
          data-sequence-stage
          className="sticky top-16 flex min-h-[calc(100svh-64px)] items-center py-6 lg:relative lg:top-auto"
        >
          <div className="future-panel relative min-h-[calc(100svh-112px)] w-full overflow-hidden rounded-[2rem]">
            <div className="absolute inset-0 bg-black">
              {sequenceFrames.map((frame) => (
                <Image
                  key={frame.src}
                  data-sequence-frame
                  src={frame.src}
                  alt={frame.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={frame.src === sequenceFrames[0]?.src}
                />
              ))}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.86),rgb(0_0_0/0.36)_46%,rgb(0_0_0/0.72))]" />
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:48px_48px]" />
              <div
                data-sequence-overlay
                className="absolute inset-y-0 left-1/3 w-1/3 rotate-12 bg-[linear-gradient(90deg,transparent,rgb(34_211_238/0.28),transparent)] blur-2xl"
              />
            </div>

            <div className="relative z-[1] grid min-h-[calc(100svh-112px)] gap-8 p-5 text-white sm:p-8 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)] lg:p-10">
              <div className="flex min-h-[26rem] flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--future-gold)] backdrop-blur">
                      Image Sequence
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur">
                      ScrollTrigger / Scrub
                    </span>
                  </div>

                  <h3
                    data-showcase-split
                    className="mt-8 max-w-3xl text-5xl font-black leading-none md:text-7xl lg:text-8xl"
                  >
                    Signal Pipeline
                  </h3>
                </div>

                <div className="max-w-xl">
                  <p className="text-sm uppercase tracking-[0.26em] text-white/[0.58]">
                    One scroll, five surfaces
                  </p>
                  <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/[0.16]">
                    <span
                      data-sequence-progress
                      className="block size-full origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,var(--future-accent),var(--future-cyan),var(--future-gold))]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex min-h-80 items-end">
                <div className="future-panel-strong relative min-h-80 w-full overflow-hidden rounded-2xl p-5 text-[var(--future-ink)] sm:p-6">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <span className="future-label">Frame Reader</span>
                    <ImageIcon className="size-5 text-[var(--future-accent)]" />
                  </div>

                  <div className="relative min-h-48">
                    {sequenceFrames.map((frame) => (
                      <div
                        key={frame.title}
                        data-sequence-caption
                        className="absolute inset-0"
                      >
                        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--future-muted)]">
                          {frame.label}
                        </p>
                        <h4 className="mt-3 text-4xl font-black leading-none md:text-5xl">
                          {frame.title}
                        </h4>
                        <p className="future-muted mt-5 text-sm leading-7 md:text-base">
                          {frame.copy}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid grid-cols-5 gap-2">
                    {sequenceFrames.map((frame, index) => (
                      <span
                        key={frame.title}
                        className="h-1 rounded-full bg-[var(--future-line)]"
                        aria-label={`${frame.title} ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 grid w-full max-w-screen-2xl gap-6 px-6 md:px-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:px-16">
        <div
          data-physics-lab
          data-showcase-reveal
          className="future-panel relative min-h-[34rem] overflow-hidden rounded-[2rem] p-5 sm:p-7"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,var(--future-cyan-soft),transparent_30rem),radial-gradient(circle_at_80%_78%,var(--future-accent-soft),transparent_30rem)]" />
          <div className="relative z-[1]">
            <div className="flex items-center justify-between gap-4">
              <span className="future-label">Physics Field</span>
              <Magnet className="size-5 text-[var(--future-accent)]" />
            </div>
            <h3
              data-showcase-split
              className="mt-6 max-w-xl text-4xl font-black leading-none md:text-5xl"
            >
              让工程关键词带一点重力
            </h3>
            <p className="future-muted mt-4 max-w-xl text-sm leading-7 md:text-base">
              关键词不只是列表，它们会像被拉回轨道的对象一样落位。外层的小信号点用
              Physics2D 做一次轻量爆发。
            </p>
          </div>

          <div className="relative z-[1] mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {physicsTokens.map((token, index) => (
              <div
                key={token}
                data-physics-token
                className={cn(
                  "rounded-2xl border border-[var(--future-line)] bg-white/[0.08] px-3 py-4 text-center shadow-[var(--future-inner)] backdrop-blur-xl",
                  index % 3 === 1 && "sm:translate-y-8",
                  index % 4 === 0 && "sm:translate-y-4",
                )}
              >
                <p className="font-mono text-sm font-black text-[var(--future-ink)]">
                  {token}
                </p>
              </div>
            ))}
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-[2]"
            aria-hidden="true"
          >
            {Array.from({ length: 34 }).map((_, index) => (
              <span
                key={index}
                data-physics-spark
                className="absolute size-2 rounded-full bg-[var(--future-cyan)] shadow-[0_0_18px_var(--future-cyan)]"
              />
            ))}
          </div>
        </div>

        <div
          data-showcase-reveal
          className="grid gap-6 lg:grid-rows-[minmax(23rem,0.62fr)_auto]"
        >
          <div className="future-panel relative min-h-[30rem] overflow-hidden rounded-[2rem]">
            <div
              data-mask-visual
              className="absolute inset-0 overflow-hidden rounded-[2rem]"
              style={maskStyle}
            >
              <Image
                src="/images/home-showcase/mask-lab.jpg"
                alt="Blue-lit server hardware in a data center"
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,transparent_0_24%,rgb(0_0_0/0.38)_60%,rgb(0_0_0/0.72))]" />
            <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(110deg,transparent_0_42%,rgb(255_255_255/0.2)_45%,transparent_48%)]" />
            <div className="relative z-[1] flex min-h-[30rem] flex-col justify-between p-5 text-white sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--future-gold)] backdrop-blur">
                  Image Mask
                </span>
                <ScanLine className="size-5 text-white/70" />
              </div>
              <div data-mask-copy className="max-w-xl">
                <h3
                  data-showcase-split
                  className="text-4xl font-black leading-none md:text-6xl"
                >
                  Reveal the Agent Layer
                </h3>
                <p className="mt-5 text-sm leading-7 text-white/[0.72] md:text-base">
                  图像不是直接出现，而是被滚动打开。像一次代码审查，先看到轮廓，再逐步暴露真正的上下文。
                </p>
              </div>
            </div>
          </div>

          <div className="future-panel-strong grid gap-4 rounded-2xl p-5 sm:grid-cols-3 sm:p-6">
            {[
              { icon: Layers3, value: "05", label: "visual layers" },
              { icon: MousePointer2, value: "1:1", label: "scroll control" },
              { icon: Zap, value: "0ms", label: "extra runtime deps" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="min-w-0">
                  <div className="flex items-center gap-2 text-[var(--future-accent)]">
                    <Icon className="size-4" />
                    <span className="font-mono text-3xl font-black text-[var(--future-ink)]">
                      {item.value}
                    </span>
                  </div>
                  <p className="future-muted mt-2 truncate font-mono text-[0.68rem] uppercase tracking-[0.18em]">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-screen-2xl px-6 pt-20 md:px-10 lg:px-16">
        <div
          data-showcase-reveal
          className="border-y border-[var(--future-line)] py-10 md:flex md:items-center md:justify-between md:gap-8"
        >
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Sparkles className="size-5 text-[var(--future-accent)]" />
              <span className="future-label">Field Notes Continue</span>
            </div>
            <h3 className="future-heading max-w-3xl text-3xl font-black leading-tight md:text-5xl">
              接下来继续写工程文章、工具实验和 AI 协作现场。
            </h3>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-0">
            <Link
              href={PATHS.SITE_BLOG}
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 rounded-full bg-[var(--future-accent)] px-6 text-white hover:bg-[var(--future-accent)]/90",
              )}
            >
              读最新文章
              <ArrowUpRight className="ml-2 size-4" />
            </Link>
            <Link
              href={PATHS.SITE_ABOUT}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 rounded-full border-[var(--future-line)] bg-white/[0.04] px-6 text-[var(--future-ink)] hover:bg-white/[0.08]",
              )}
            >
              <Cpu className="mr-2 size-4 text-[var(--future-accent)]" />
              看工作台
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

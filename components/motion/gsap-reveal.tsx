"use client";

import React from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type GsapRevealProps = React.PropsWithChildren<{
  className?: string;
  selector?: string;
  stagger?: number;
}>;

export const GsapReveal = ({
  children,
  className,
  selector = "[data-gsap-reveal]",
  stagger = 0.05,
}: GsapRevealProps) => {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(selector);

      if (!items.length) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(items, { autoAlpha: 1, clearProps: "transform,filter" });
        return;
      }

      items.forEach((item, index) => {
        gsap.fromTo(
          item,
          {
            autoAlpha: 0,
            y: 24,
            filter: "blur(12px)",
          },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            delay: Math.min(index * stagger, 0.32),
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className={cn("contents", className)}>
      {children}
    </div>
  );
};

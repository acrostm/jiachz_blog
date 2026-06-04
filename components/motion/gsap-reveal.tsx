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
      const root = scope.current;
      const items = root
        ? gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector))
        : [];

      if (!items.length) {
        return;
      }

      const clearRevealStyles = () => {
        gsap.set(items, {
          clearProps: "opacity,visibility,transform,filter",
        });
      };

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        clearRevealStyles();
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
            onComplete: () => {
              gsap.set(item, {
                clearProps: "opacity,visibility,transform,filter",
              });
            },
            scrollTrigger: {
              trigger: item,
              start: "top 88%",
              once: true,
            },
          },
        );
      });

      gsap.delayedCall(1.6, clearRevealStyles);
      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope },
  );

  return (
    <div ref={scope} className={cn("contents", className)}>
      {children}
    </div>
  );
};

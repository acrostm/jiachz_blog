"use client";

import React from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const ArticleReadingProgress = () => {
  const progressRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!progressRef.current) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      progressRef.current.style.transform = "scaleX(1)";
      return;
    }

    gsap.fromTo(
      progressRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      },
    );
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-40 h-px bg-transparent">
      <div
        ref={progressRef}
        className="h-full origin-left bg-[linear-gradient(90deg,var(--future-accent),var(--future-cyan),var(--future-gold))]"
      />
    </div>
  );
};

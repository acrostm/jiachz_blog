"use client";

import React from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

const blobClassNames = [
  "future-ambient__blob future-ambient__blob--copper",
  "future-ambient__blob future-ambient__blob--cyan",
  "future-ambient__blob future-ambient__blob--gold",
  "future-ambient__blob future-ambient__blob--rose",
  "future-ambient__blob future-ambient__blob--signal",
];

export const FutureBackground = () => {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(".future-ambient__blob", {
          clearProps: "transform",
          opacity: 0.62,
        });
        return;
      }

      const blobs = gsap.utils.toArray<HTMLElement>(".future-ambient__blob");

      blobs.forEach((blob, index) => {
        gsap.to(blob, {
          x: index % 2 === 0 ? 120 + index * 10 : -110 - index * 12,
          y: index % 2 === 0 ? -90 - index * 8 : 105 + index * 9,
          rotate: index % 2 === 0 ? 18 : -16,
          scale: index % 2 === 0 ? 1.14 : 0.9,
          duration: 24 + index * 4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      gsap.to(".future-ambient__grid", {
        backgroundPosition: "144px 96px",
        duration: 36,
        ease: "none",
        repeat: -1,
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className="future-ambient" aria-hidden="true">
      <div className="future-ambient__grid" />
      {blobClassNames.map((className) => (
        <span key={className} className={className} />
      ))}
    </div>
  );
};

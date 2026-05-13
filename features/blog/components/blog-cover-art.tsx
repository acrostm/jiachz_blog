import React from "react";

import Image from "next/image";

import { cn } from "@/lib/utils";

type BlogCoverArtProps = {
  title: string;
  cover?: string | null;
  index?: number;
  priority?: boolean;
  className?: string;
};

const accents = ["#df7245", "#22d3ee", "#e3ad5d", "#a78bfa"];

const getSeed = (value: string) =>
  Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

export const BlogCoverArt = ({
  title,
  cover,
  index = 0,
  priority = false,
  className,
}: BlogCoverArtProps) => {
  const seed = getSeed(title);
  const accent = accents[(seed + index) % accents.length];

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#08090c]",
        "shadow-[0_24px_80px_rgb(0_0_0/0.28)]",
        className,
      )}
      style={
        {
          "--cover-accent": accent,
          "--cover-angle": `${(seed % 70) + 18}deg`,
        } as React.CSSProperties
      }
    >
      {cover ? (
        <Image
          src={cover}
          alt={title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover opacity-80 transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_srgb,var(--cover-accent)_52%,transparent),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(34,211,238,0.22),transparent_32%),linear-gradient(var(--cover-angle),#101116,#050506_58%,#15100d)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,rgba(255,255,255,.09)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.075)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="absolute left-8 top-7 size-16 rounded-full border border-[color-mix(in_srgb,var(--cover-accent)_52%,transparent)]" />
          <div className="absolute bottom-8 right-8 size-24 rounded-full border border-cyan-300/25" />
          <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          <div className="absolute left-8 top-1/2 h-20 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[var(--cover-accent)] to-transparent" />
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.58))]" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white">
        <div className="min-w-0">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-white/55">
            Field Note
          </p>
          <p className="mt-2 line-clamp-2 text-xl font-semibold leading-tight">
            {title}
          </p>
        </div>
        <div className="font-mono text-5xl font-semibold tracking-[-0.08em] text-white/15">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
};

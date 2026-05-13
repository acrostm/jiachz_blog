import React from "react";

import Link from "next/link";

import { PATHS, PATHS_MAP, SLOGAN, navItems } from "@/constants";
import { getSiteStatistics } from "@/features/statistics";
import { cn } from "@/lib/utils";
import { formatNum } from "@/utils";

import { Wrapper } from "../wrapper";

export const Footer = async () => {
  const { pv, uv, todayPV, todayUV } = await getSiteStatistics();

  return (
    <footer className="relative z-[1] px-6 pb-12 pt-24">
      <Wrapper
        className={cn(
          "future-panel grid grid-cols-1 gap-x-24 gap-y-10 rounded-[1.5rem] px-6 py-8 text-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        )}
      >
        <dl className="flex flex-col gap-3">
          <dt className="future-label">Navigation</dt>
          {navItems.map((el) => (
            <dd key={el.link}>
              <Link
                href={el.link}
                className="future-muted flex items-center transition-colors hover:text-[var(--future-ink)]"
              >
                {el.label}
              </Link>
            </dd>
          ))}
          <dd>
            <Link
              href={PATHS.SITEMAP}
              className="future-muted transition-colors hover:text-[var(--future-ink)]"
            >
              {PATHS_MAP[PATHS.SITEMAP]}
            </Link>
          </dd>
        </dl>
        <dl className="flex flex-col gap-3">
          <dt className="future-label">Signal</dt>
          <dd>
            今日 <span>{formatNum(todayPV)}</span> 次浏览
          </dd>
          <dd>
            今日 <span>{formatNum(todayUV)}</span> 人访问
          </dd>

          <dd>
            总 <span>{formatNum(pv)}</span> 次浏览（PV）
          </dd>
          <dd>
            总 <span>{formatNum(uv)}</span> 人访问（UV）
          </dd>
        </dl>
      </Wrapper>

      <Wrapper className="future-muted flex flex-col items-center justify-center gap-1 pt-10 text-sm md:flex-row md:gap-4">
        <div className="order-3 font-mono text-xs uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} {`Jiach`}&nbsp;&nbsp;·&nbsp;&nbsp;
          {SLOGAN}
        </div>
      </Wrapper>
    </footer>
  );
};

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
    <footer className="px-6 py-12">
      <Wrapper
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-24 gap-y-8 text-sm text-muted-foreground",
        )}
      >
        <dl className="flex flex-col gap-3">
          <dt className="text-lg font-semibold text-primary">导航</dt>
          {navItems.map((el) => (
            <dd key={el.link}>
              <Link
                href={el.link}
                className="flex items-center transition-colors hover:font-semibold hover:text-primary"
              >
                {el.label}
              </Link>
            </dd>
          ))}
          <dd>
            <Link
              href={PATHS.SITEMAP}
              className="transition-colors hover:font-semibold hover:text-primary"
            >
              {PATHS_MAP[PATHS.SITEMAP]}
            </Link>
          </dd>
        </dl>
        <dl className="flex flex-col gap-3">
          <dt className="text-lg font-semibold text-primary">统计</dt>
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

      <Wrapper className="flex flex-col items-center justify-center space-y-1 pt-24 text-sm text-muted-foreground md:flex-row md:space-x-4 md:space-y-0">
        <div className="order-3">
          &copy; {new Date().getFullYear()} {`Jiach`}&nbsp;&nbsp;·&nbsp;&nbsp;
          {SLOGAN}
        </div>
      </Wrapper>
    </footer>
  );
};

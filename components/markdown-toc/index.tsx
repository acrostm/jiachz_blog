"use client";

import React, { useMemo } from "react";

import Link from "next/link";

import { toSlug } from "@/lib/utils";

import { type OptionItem } from "@/types";

export const MarkdownTOC = ({ body }: { body: string }) => {
  const tocList = useMemo<OptionItem<string>[]>(() => {
    const matches = Array.from(body.matchAll(/^##\s+(.+)$/gm));
    return matches.map((m) => {
      const title = m[1] as string;
      return {
        value: toSlug(title),
        label: title,
      };
    });
  }, [body]);

  return (
    <div>
      <div>目录</div>
      <ul className="flex flex-col gap-2 pt-8 text-sm text-muted-foreground">
        {tocList.length > 0 ? (
          tocList.map((el) => (
            <li key={el.value}>
              <Link
                href={`#${el.value}`}
                className="line-clamp-1 text-ellipsis transition-colors hover:text-primary"
              >
                {el.label}
              </Link>
            </li>
          ))
        ) : (
          <li>无目录</li>
        )}
      </ul>
    </div>
  );
};

import React from "react";

import Link from "next/link";

import { type OptionItem } from "@/types";

type MarkdownTOCProps = {
  tocList: OptionItem<string>[];
};

export const MarkdownTOC = ({ tocList }: MarkdownTOCProps) => {
  return (
    <div>
      <div className="future-label">Contents</div>
      <ul className="flex flex-col gap-3 pt-6 text-sm">
        {tocList.length > 0 ? (
          tocList.map((el) => (
            <li key={el.value}>
              <Link
                href={`#${el.value}`}
                className="future-muted line-clamp-2 text-ellipsis border-l border-[var(--future-line)] pl-3 leading-5 transition-colors hover:border-[var(--future-accent)] hover:text-[var(--future-ink)]"
              >
                {el.label}
              </Link>
            </li>
          ))
        ) : (
          <li className="future-muted">无目录</li>
        )}
      </ul>
    </div>
  );
};

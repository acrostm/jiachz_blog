"use client";

import React from "react";

import Link from "next/link";

import { useMount } from "ahooks";

import { type OptionItem } from "@/types";

export const MarkdownTOC = () => {
  const [tocList, setTocList] = React.useState<OptionItem<string>[]>([]);

  useMount(() => {
    const markdownBodyElement = document.querySelector(".markdown-body");
    if (!markdownBodyElement) return;

    const h2Elems = markdownBodyElement.querySelectorAll("h2");
    const newTocList: OptionItem<string>[] = [];

    h2Elems.forEach((h2) => {
      const text = h2.textContent;
      const id = h2.getAttribute("id");
      if (text && id) {
        newTocList.push({
          value: id,
          label: text,
        });
      }
    });

    setTocList(newTocList);
  });

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

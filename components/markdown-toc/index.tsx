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

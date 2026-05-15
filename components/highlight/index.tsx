import React from "react";

import { cn } from "@/lib/utils";

type HighlightProps = {
  className?: string;
  highlightMarkClassName?: string;
  sourceString: string;
  searchWords?: string[];
  // 是否大小写敏感
  caseSensitive?: boolean;
};

type HighlightMarkProps = {
  text: string;
  className?: string;
};

export const HighlightMark = ({ text, className }: HighlightMarkProps) => {
  return (
    <span
      className={cn("bg-green-300/20 dark:bg-green-100/30 mx-1", className)}
    >
      {text}
    </span>
  );
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const Highlight = ({
  sourceString,
  searchWords,
  className,
  highlightMarkClassName,
  caseSensitive,
}: HighlightProps) => {
  if (!searchWords?.length) {
    return sourceString;
  }

  if (!sourceString?.trim()) {
    return "";
  }

  const normalizedWords = searchWords
    .map((word) => word.trim())
    .filter(Boolean);

  if (!normalizedWords.length) {
    return sourceString;
  }

  const regex = new RegExp(
    `(${normalizedWords.map(escapeRegExp).join("|")})`,
    caseSensitive ? "g" : "gi",
  );

  // 使用正则表达式将sourceString根据searchWords拆分成数组
  const splitArray = sourceString.split(regex);
  const matchSet = new Set(
    normalizedWords.map((word) => (caseSensitive ? word : word.toLowerCase())),
  );

  return (
    <div className={cn("inline-flex items-center", className)}>
      {splitArray.map((el, idx) => {
        const matchKey = caseSensitive ? el : el.toLowerCase();
        if (matchSet.has(matchKey)) {
          return (
            <HighlightMark
              key={el + idx}
              text={el}
              className={highlightMarkClassName}
            />
          );
        } else {
          return el;
        }
      })}
    </div>
  );
};

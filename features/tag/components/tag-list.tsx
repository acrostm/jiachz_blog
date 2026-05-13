import React from "react";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { TagPrefixIcon } from "./tag-prefix-icon";

import { type Tag } from "../types";

type TagListProps = {
  tags?: Pick<Tag, "id" | "name" | "icon" | "iconDark">[];
};

export const TagList = ({ tags }: TagListProps) => {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags?.map((el) => (
        <li
          key={el.id}
          className={cn(
            "cursor-pointer",
            buttonVariants({
              variant: "outline",
            }),
            "rounded-full border-[var(--future-line)] bg-white/[0.04] font-mono text-xs uppercase tracking-[0.18em] text-[var(--future-muted)] hover:bg-white/[0.08] hover:text-[var(--future-ink)]",
          )}
        >
          <TagPrefixIcon tag={el} />
          <span>{el.name}</span>
        </li>
      ))}
    </ul>
  );
};

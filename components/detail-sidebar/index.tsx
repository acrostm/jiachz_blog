"use client";

import React from "react";

import { cn } from "@/lib/utils";

type DetailSidebarProps = React.PropsWithChildren;

export const DetailSidebar = ({ children }: DetailSidebarProps) => {
  return (
    <div
      className={cn(
        "future-panel hidden h-fit rounded-[1.5rem] px-5 py-6 sticky top-24",
        "wrapper:block",
      )}
    >
      {children}
    </div>
  );
};

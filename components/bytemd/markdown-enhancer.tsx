"use client";

import React from "react";

import { bindCodeCopyButtons } from "./plugins/code-block";

type MarkdownEnhancerProps = {
  markdownBodyID: string;
};

export const MarkdownEnhancer = ({ markdownBodyID }: MarkdownEnhancerProps) => {
  React.useEffect(() => {
    const markdownBody = document.getElementById(markdownBodyID);
    if (!markdownBody) {
      return;
    }

    let mounted = true;
    const cleanups: Array<() => void> = [bindCodeCopyButtons(markdownBody)];

    void import("@bytemd/plugin-medium-zoom").then(
      ({ default: mediumZoom }) => {
        if (!mounted) {
          return;
        }

        const cleanup = mediumZoom().viewerEffect?.({
          file: undefined as never,
          markdownBody,
        });
        if (typeof cleanup === "function") {
          cleanups.push(cleanup);
        }
      },
    );

    return () => {
      mounted = false;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [markdownBodyID]);

  return null;
};

import { cache } from "react";

import { type BytemdPlugin, getProcessor } from "bytemd";
import { visit } from "unist-util-visit";

import { type OptionItem } from "@/types";

import { plugins, sanitize } from "./config";
import {
  type HastElement,
  type HastRoot,
  getStringProperty,
  isElement,
  isText,
} from "./plugins/hast";

type RenderedMarkdown = {
  html: string;
  toc: OptionItem<string>[];
};

const getTextContent = (node: HastElement): string => {
  return node.children
    .map((child) => {
      if (isText(child)) {
        return child.value;
      }

      if (isElement(child)) {
        return getTextContent(child);
      }

      return "";
    })
    .join("")
    .trim();
};

const createTocPlugin = (toc: OptionItem<string>[]): BytemdPlugin => ({
  rehype: (processor) =>
    processor.use(() => (tree: HastRoot) => {
      visit(tree, "element", (node: HastElement) => {
        if (node.tagName !== "h2") {
          return;
        }

        const id = getStringProperty(node.properties, "id");
        const label = getTextContent(node);
        if (!id || !label) {
          return;
        }

        toc.push({ label, value: id });
      });
    }),
});

export const renderMarkdown = cache((body: string): RenderedMarkdown => {
  const toc: OptionItem<string>[] = [];
  const file = getProcessor({
    plugins: [...plugins, createTocPlugin(toc)],
    sanitize,
  }).processSync(body);

  return {
    html: file.toString(),
    toc,
  };
});

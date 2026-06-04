import type { BytemdPlugin } from "bytemd";
import { visit } from "unist-util-visit";

import {
  type HastElement,
  type HastParent,
  type HastRoot,
  getClassNames,
  isElement,
} from "./hast";

const TABLE_WRAPPER_CLASS = "markdown-table-wrapper";

const createTableWrapper = (table: HastElement): HastElement => ({
  type: "element",
  tagName: "div",
  properties: {
    className: [TABLE_WRAPPER_CLASS],
    role: "region",
    tabIndex: 0,
  },
  children: [table],
});

const hasTableWrapper = (parent: HastParent | undefined) => {
  return (
    isElement(parent) &&
    parent.tagName === "div" &&
    getClassNames(parent.properties).includes(TABLE_WRAPPER_CLASS)
  );
};

export const tablePlugin = (): BytemdPlugin => {
  return {
    rehype: (processor) =>
      processor.use(() => (tree: HastRoot) => {
        visit(tree, "element", (node: HastElement, index, parent) => {
          if (
            node.tagName !== "table" ||
            typeof index !== "number" ||
            !parent ||
            hasTableWrapper(parent)
          ) {
            return;
          }

          parent.children[index] = createTableWrapper(node);
        });
      }),
  };
};

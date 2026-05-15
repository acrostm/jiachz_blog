import type { BytemdPlugin } from "bytemd";
import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

import { appendClassName, isElement, isText } from "./hast";

/**
 * Plugin to handle inline code display
 * - Removes backticks from inline code display
 * - Improves inline code styling
 */
export const inlineCodePlugin = (): BytemdPlugin => {
  return {
    rehype: (process) =>
      process.use(() => (tree: Root) => {
        visit(tree, "element", (node: Element, _index, parent) => {
          // Handle inline code elements (not in pre blocks)
          if (
            node.tagName === "code" &&
            !(isElement(parent) && parent.tagName === "pre")
          ) {
            // Add a class for styling
            appendClassName(node, "inline-code-enhanced");

            // Clean up the text content to remove backticks
            const textNode = node.children[0];
            if (isText(textNode)) {
              // Remove leading and trailing backticks if they exist
              let cleanText = textNode.value;
              if (cleanText.startsWith("`") && cleanText.endsWith("`")) {
                cleanText = cleanText.slice(1, -1);
              }
              textNode.value = cleanText;
            }
          }
        });
      }),

    viewerEffect({ markdownBody }) {
      // Additional client-side processing if needed
      if (typeof window === "undefined") return;

      const inlineCodes = markdownBody.querySelectorAll("code:not(pre code)");
      inlineCodes.forEach((code) => {
        // Ensure backticks are removed from display
        const text = code.textContent ?? "";
        if (text.startsWith("`") && text.endsWith("`") && text.length > 2) {
          code.textContent = text.slice(1, -1);
        }

        // Add enhanced class for styling
        code.classList.add("inline-code-enhanced");
      });
    },
  };
};

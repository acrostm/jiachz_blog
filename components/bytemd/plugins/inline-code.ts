/* eslint-disable */
// @ts-nocheck
import type { BytemdPlugin } from "bytemd";
import { visit } from "unist-util-visit";

/**
 * Plugin to handle inline code display
 * - Removes backticks from inline code display
 * - Improves inline code styling
 */
export const inlineCodePlugin = (): BytemdPlugin => {
  return {
    rehype: (process) =>
      process.use(() => (tree) => {
        visit(tree, "element", (node) => {
          // Handle inline code elements (not in pre blocks)
          if (node.tagName === "code" && node.parent?.tagName !== "pre") {
            // Add a class for styling
            if (!node.properties) {
              node.properties = {};
            }
            if (!node.properties.className) {
              node.properties.className = [];
            }
            if (Array.isArray(node.properties.className)) {
              node.properties.className.push("inline-code-enhanced");
            }

            // Clean up the text content to remove backticks
            if (node.children && node.children.length > 0) {
              const textNode = node.children[0];
              if (
                textNode.type === "text" &&
                typeof textNode.value === "string"
              ) {
                // Remove leading and trailing backticks if they exist
                let cleanText = textNode.value;
                if (cleanText.startsWith("`") && cleanText.endsWith("`")) {
                  cleanText = cleanText.slice(1, -1);
                }
                textNode.value = cleanText;
              }
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
        let text = code.textContent || "";
        if (text.startsWith("`") && text.endsWith("`") && text.length > 2) {
          code.textContent = text.slice(1, -1);
        }

        // Add enhanced class for styling
        code.classList.add("inline-code-enhanced");
      });
    },
  };
};

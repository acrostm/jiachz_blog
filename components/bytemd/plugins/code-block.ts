import type { BytemdPlugin } from "bytemd";
import { visit } from "unist-util-visit";

import { copyToClipboard, isBrowser } from "@/lib/utils";

import {
  type HastElement,
  type HastRoot,
  cloneHastNode,
  createElementFromHtml,
  getClassNames,
  isElement,
} from "./hast";

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const copyButtonNode = createElementFromHtml(`
<button type="button" class="copy-code-button" title="复制代码" aria-label="复制代码">
${copyIcon}
</button>
`);

const clipboardCheckIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const createLanguageLabelNode = (language: string): HastElement => ({
  type: "element",
  tagName: "span",
  properties: {
    ariaHidden: true,
    className: ["code-block-language"],
  },
  children: [{ type: "text", value: language.toUpperCase() }],
});

const getCodeLanguage = (node: HastElement) => {
  const languageClass = getClassNames(node.properties).find(
    (className) =>
      className.startsWith("language-") || className.startsWith("lang-"),
  );

  return languageClass?.replace(/^lang(uage)?-/, "")?.split(":")[0];
};

export const bindCodeCopyButtons = (markdownBody: HTMLElement) => {
  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof globalThis.Element)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>(".copy-code-button");
    if (!button || !markdownBody.contains(button)) {
      return;
    }

    void (async () => {
      const code = button.closest("pre")?.querySelector("code");
      let codeText = code?.textContent ?? "";

      if (codeText.startsWith("$")) {
        codeText = codeText.slice(1).trim();
      }

      const copied = await copyToClipboard(codeText);
      if (!copied) {
        return;
      }

      const existingTimer = button.dataset.copyResetTimer;
      if (existingTimer) {
        window.clearTimeout(Number(existingTimer));
      }

      button.innerHTML = clipboardCheckIcon;
      button.setAttribute("aria-label", "代码已复制");

      const timer = window.setTimeout(() => {
        button.innerHTML = copyIcon;
        button.setAttribute("aria-label", "复制代码");
        delete button.dataset.copyResetTimer;
      }, 2 * 1000);

      button.dataset.copyResetTimer = String(timer);
    })();
  };

  markdownBody.addEventListener("click", handleClick);

  return () => {
    markdownBody.removeEventListener("click", handleClick);
    markdownBody
      .querySelectorAll<HTMLButtonElement>(".copy-code-button")
      .forEach((button) => {
        const existingTimer = button.dataset.copyResetTimer;
        if (existingTimer) {
          window.clearTimeout(Number(existingTimer));
          delete button.dataset.copyResetTimer;
        }
      });
  };
};

/**
 * 插件功能
 * 1. 显示代码类型
 * 2. 增加复制代码按钮
 */
export const codeBlockPlugin = (): BytemdPlugin => {
  return {
    rehype: (process) =>
      process.use(() => (tree: HastRoot) => {
        visit(tree, "element", (node: HastElement) => {
          if (node.tagName === "pre") {
            const codeElement = node.children.find(
              (child): child is HastElement =>
                isElement(child) && child.tagName === "code",
            );
            const language = codeElement ? getCodeLanguage(codeElement) : null;

            node.properties ??= {};
            node.properties.className = [
              ...getClassNames(node.properties),
              "markdown-code-block",
            ];

            const nextChildren = [...node.children];
            if (language) {
              node.properties["data-language"] = language.toUpperCase();
              nextChildren.unshift(createLanguageLabelNode(language));
            }

            nextChildren.push(cloneHastNode(copyButtonNode));
            node.children = nextChildren;
          }
        });
      }),

    viewerEffect({ markdownBody }) {
      if (!isBrowser()) {
        return;
      }

      return bindCodeCopyButtons(markdownBody);
    },
  };
};

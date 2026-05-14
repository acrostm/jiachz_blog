/* eslint-disable */
// @ts-nocheck
import type { BytemdPlugin } from "bytemd";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { visit } from "unist-util-visit";

import { copyToClipboard, isBrowser } from "@/lib/utils";

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const copyBtnNode = fromHtmlIsomorphic(`
<button type="button" class="copy-code-button" title="复制代码" aria-label="复制代码">
${copyIcon}
</button>
`);

const clipboardCheckIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

/**
 * 插件功能
 * 1. 显示代码类型
 * 2. 增加复制代码按钮
 */
export const codeBlockPlugin = (): BytemdPlugin => {
  return {
    rehype: (process) =>
      process.use(() => (tree) => {
        visit(tree, "element", (node) => {
          if (node.tagName === "pre") {
            // 添加复制按钮
            node.children.push(copyBtnNode);

            // 查找pre元素中的code子元素来提取语言信息
            const codeElement = node.children.find(
              (child) => child.type === "element" && child.tagName === "code",
            );

            if (codeElement) {
              const languageClass = codeElement.properties?.className?.find(
                (cls) => cls.startsWith("language-") || cls.startsWith("lang-"),
              );
              const language = languageClass
                ?.replace(/^lang(uage)?-/, "")
                ?.split(":")[0];

              if (language) {
                // 确保properties对象存在
                if (!node.properties) {
                  node.properties = {};
                }
                if (!node.properties["data-language"]) {
                  node.properties["data-language"] = language.toUpperCase();
                }
              }
            }
          }
        });
      }),

    viewerEffect({ markdownBody }) {
      // 针对 SSR 场景适配
      if (!isBrowser()) {
        return;
      }

      const elements = markdownBody.querySelectorAll(".copy-code-button");
      for (const element of elements) {
        if ((element as HTMLElement).dataset.copyBound === "true") {
          continue;
        }
        (element as HTMLElement).dataset.copyBound = "true";

        // 点击按钮复制代码到粘贴板
        element.addEventListener("click", () => {
          void (async () => {
            const code = element.parentElement?.querySelector("code");
            let codeText = code?.textContent ?? "";
            // 复制代码时去除开头的$符号，然后trim一下，一般是复制shell命令的代码块会用到
            if (codeText.startsWith("$")) {
              codeText = codeText.slice(1).trim();
            }
            const copied = await copyToClipboard(codeText);
            if (!copied) {
              return;
            }

            const tmp = element.innerHTML;
            element.innerHTML = clipboardCheckIcon;
            element.setAttribute("aria-label", "代码已复制");
            let timer = 0;

            timer = window.setTimeout(() => {
              element.innerHTML = tmp;
              element.setAttribute("aria-label", "复制代码");
              window.clearTimeout(timer);
              timer = 0;
            }, 3 * 1000);
          })();
        });
      }
    },
  };
};

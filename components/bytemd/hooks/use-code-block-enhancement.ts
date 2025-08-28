import { useCallback, useEffect } from "react";

export const useCodeBlockEnhancement = (
  containerRef: React.RefObject<HTMLDivElement>,
  content: string,
) => {
  const enhanceCodeBlocks = useCallback(() => {
    if (!containerRef.current) return;

    const preElements = containerRef.current.querySelectorAll("pre");

    preElements.forEach((pre) => {
      // 防止重复添加按钮
      if (pre.querySelector(".copy-code-button")) {
        return;
      }

      // 添加样式类
      pre.classList.add("enhanced-code-block");

      const copyButton = document.createElement("button");
      copyButton.className = "copy-code-button";
      copyButton.title = "Copy code";
      copyButton.setAttribute("aria-label", "Copy code to clipboard");

      // 使用更优化的SVG图标
      copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;

      const handleCopy = async () => {
        const codeElement = pre.querySelector("code");
        let codeToCopy = codeElement ? codeElement.innerText : pre.innerText;

        // 清理代码内容，移除语言标签
        const languageLabel = pre.getAttribute("data-language");
        if (languageLabel && codeToCopy.startsWith(languageLabel)) {
          codeToCopy = codeToCopy.substring(languageLabel.length).trim();
        }

        try {
          await navigator.clipboard.writeText(codeToCopy);
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          copyButton.setAttribute("aria-label", "Code copied!");

          // 添加成功动画效果
          copyButton.style.transform = "scale(1.1)";
          setTimeout(() => {
            copyButton.style.transform = "scale(1)";
          }, 150);

          setTimeout(() => {
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
            copyButton.setAttribute("aria-label", "Copy code to clipboard");
          }, 2000);
        } catch {
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
          copyButton.setAttribute("aria-label", "Copy failed");
          setTimeout(() => {
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
            copyButton.setAttribute("aria-label", "Copy code to clipboard");
          }, 2000);
        }
      };

      copyButton.addEventListener("click", () => {
        void handleCopy();
      });

      // 直接将按钮添加到 pre 元素
      pre.appendChild(copyButton);

      // 添加语言标签到Mac按钮旁边
      const language = pre.getAttribute("data-language");
      if (language) {
        const languageLabel = document.createElement("span");
        languageLabel.className = "vscode-language-label";
        languageLabel.textContent =
          language.charAt(0).toUpperCase() + language.slice(1);
        languageLabel.style.cssText = `
          position: absolute;
          top: 8px;
          left: 70px;
          font-size: 12px;
          font-weight: 500;
          z-index: 4;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        pre.appendChild(languageLabel);
      }
    });
  }, [containerRef]);

  useEffect(() => {
    // 使用 requestAnimationFrame 来优化 DOM 操作的时机
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        enhanceCodeBlocks();
      });
    }, 100); // 给内容渲染一些时间

    return () => clearTimeout(timeoutId);
  }, [enhanceCodeBlocks, content]);

  // 清理函数
  const cleanup = useCallback(() => {
    if (!containerRef.current) return;

    const copyButtons =
      containerRef.current.querySelectorAll(".copy-code-button");
    copyButtons.forEach((button) => {
      // 清理事件监听器
      const newButton = button.cloneNode(true);
      button.parentNode?.replaceChild(newButton, button);
    });
  }, [containerRef]);

  return { cleanup };
};

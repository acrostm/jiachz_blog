"use client";

import React, { useEffect, useRef } from "react";

import { Viewer } from "@bytemd/react";

import { plugins, sanitize } from "./config";

// 假设图标组件路径

// 确保在你的项目中有一个合适的CSS文件来定义 .code-block-wrapper, .copy-button 等样式
// 例如: styles/custom-code-block.css

type BytemdViewerProps = {
  body: string;
};

export const BytemdViewer = ({ body }: BytemdViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    const preElements = viewerRef.current.querySelectorAll("pre");

    preElements.forEach((pre) => {
      // 防止重复添加按钮
      if (pre.querySelector(".copy-button")) {
        return;
      }

      pre.classList.add("code-block-container"); // 用于CSS样式

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      // 将 pre 元素移动到 wrapper 内部
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const copyButton = document.createElement("button");
      copyButton.className = "copy-button";
      copyButton.title = "Copy code";

      // 使用SVG图标或文字，这里用文字示例，你可以替换为Icons.copy
      // 为了简单起见，这里直接使用文字，你可以替换为 <Icons.copy /> 的SVG字符串或DOM
      copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;

      copyButton.addEventListener("click", () => {
        void (async () => {
          const codeElement = pre.querySelector("code");
          const codeToCopy = codeElement
            ? codeElement.innerText
            : pre.innerText;
          try {
            await navigator.clipboard.writeText(codeToCopy);
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
            }, 2000);
          } catch (err) {
            copyButton.innerText = "Error";
            setTimeout(() => {
              copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
            }, 2000);
          }
        })();
      });
      // 将按钮添加到 wrapper 的右上角
      wrapper.style.position = "relative"; // 确保按钮可以相对于wrapper定位
      wrapper.appendChild(copyButton);
    });
  }, [body]);

  return (
    <div ref={viewerRef}>
      <Viewer value={body} plugins={plugins} sanitize={sanitize} />
    </div>
  );
};

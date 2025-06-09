"use client";

import { useEffect, useRef } from "react";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";

import { toSlug } from "@/lib/utils";

const lowlight = createLowlight(all);

export type TiptapViewerProps = {
  body: string;
};

export const TiptapViewer = ({ body }: TiptapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new Editor({
      editable: false,
      extensions: [
        StarterKit,
        CodeBlockLowlight.configure({ lowlight }),
        Markdown,
      ],
    });
    editor.commands.setContent(body);
    containerRef.current.innerHTML = editor.getHTML();
    editor.destroy();

    const headings =
      containerRef.current.querySelectorAll<HTMLElement>("h2, h3, h4, h5, h6");
    headings.forEach((el) => {
      const slug = toSlug(el.textContent || "");
      el.id = slug;
      if (!el.querySelector(".markdown-anchor")) {
        const anchor = document.createElement("a");
        anchor.href = `#${slug}`;
        anchor.className = "markdown-anchor ml-2";
        anchor.innerHTML = `#`;
        el.appendChild(anchor);
      }
    });

    const preElements = containerRef.current.querySelectorAll("pre");
    preElements.forEach((pre) => {
      if (pre.querySelector(".copy-button")) return;
      pre.classList.add("code-block-container");
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode?.insertBefore(wrapper, pre);
      const header = document.createElement("div");
      header.className = "code-block-header";
      header.innerHTML =
        '<span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>';
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
      const copyButton = document.createElement("button");
      copyButton.className = "copy-button";
      copyButton.title = "Copy code";
      copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
      copyButton.addEventListener("click", async () => {
        const codeElement = pre.querySelector("code");
        const codeToCopy = codeElement ? codeElement.innerText : pre.innerText;
        try {
          await navigator.clipboard.writeText(codeToCopy);
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          setTimeout(() => {
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
          }, 2000);
        } catch (err) {
          console.error("Failed to copy: ", err);
          copyButton.innerText = "Error";
          setTimeout(() => {
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
          }, 2000);
        }
      });
      wrapper.style.position = "relative";
      wrapper.appendChild(copyButton);
    });
  }, [body]);

  return <div ref={containerRef} className="markdown-body" />;
};

"use client";

import React, { useRef } from "react";

import { Viewer } from "@bytemd/react";

import { plugins, sanitize } from "./config";
import { useCodeBlockEnhancement } from "./hooks/use-code-block-enhancement";

type BytemdViewerProps = {
  body: string;
};

const BytemdViewerComponent = ({ body }: BytemdViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  // 使用自定义 hook 处理代码块增强功能
  const { cleanup } = useCodeBlockEnhancement(viewerRef, body);

  // 组件卸载时清理资源
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div ref={viewerRef}>
      <Viewer value={body} plugins={plugins} sanitize={sanitize} />
    </div>
  );
};

// 使用 React.memo 缓存组件，避免不必要的重渲染
export const BytemdViewer = React.memo(
  BytemdViewerComponent,
  (prevProps, nextProps) => {
    // 只有当 body 内容发生变化时才重新渲染
    return prevProps.body === nextProps.body;
  },
);

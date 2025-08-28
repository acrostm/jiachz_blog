"use client";

import React, { useEffect, useRef } from "react";

import { Viewer } from "@bytemd/react";

import { plugins, sanitize } from "./config";
import { useCodeBlockEnhancement } from "./hooks/use-code-block-enhancement";
import { useVirtualScroll } from "./hooks/use-virtual-scroll";

type VirtualBytemdViewerProps = {
  body: string;
  enableVirtualScroll?: boolean;
  containerHeight?: number;
};

const VirtualBytemdViewerComponent = ({
  body,
  enableVirtualScroll = true,
  containerHeight = 800,
}: VirtualBytemdViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 虚拟滚动逻辑
  const virtualScroll = useVirtualScroll(body, enableVirtualScroll, {
    containerHeight,
    itemHeight: 120,
    overscan: 2,
  });

  // 使用自定义 hook 处理代码块增强功能
  const { cleanup } = useCodeBlockEnhancement(
    viewerRef,
    virtualScroll.displayContent,
  );

  // 绑定滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !virtualScroll.enabled) return;

    container.addEventListener("scroll", virtualScroll.handleScroll, {
      passive: true,
    });
    return () => {
      container.removeEventListener("scroll", virtualScroll.handleScroll);
    };
  }, [virtualScroll.enabled, virtualScroll.handleScroll]);

  // 组件卸载时清理资源
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (!virtualScroll.enabled) {
    // 内容不多时，使用普通渲染
    return (
      <div ref={viewerRef}>
        <Viewer value={body} plugins={plugins} sanitize={sanitize} />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{
          height: containerHeight,
          overflow: "auto",
        }}
        className="rounded-md border"
      >
        <div
          style={{
            height: virtualScroll.totalHeight,
            position: "relative",
          }}
        >
          <div
            ref={viewerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${virtualScroll.visibleRange.visibleItems[0]?.start ?? 0}px)`,
            }}
          >
            <Viewer
              value={virtualScroll.displayContent}
              plugins={plugins}
              sanitize={sanitize}
            />
          </div>
        </div>
      </div>

      {/* 虚拟滚动状态指示 */}
      {virtualScroll.enabled && (
        <div className="mt-2 text-xs text-muted-foreground">
          虚拟滚动已启用 - 显示 {virtualScroll.visibleRange.visibleItems.length}{" "}
          /{" "}
          {virtualScroll.virtualItems.length +
            virtualScroll.visibleRange.visibleItems.length}{" "}
          个内容块
        </div>
      )}
    </div>
  );
};

// 使用 React.memo 缓存组件
export const VirtualBytemdViewer = React.memo(
  VirtualBytemdViewerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.body === nextProps.body &&
      prevProps.enableVirtualScroll === nextProps.enableVirtualScroll &&
      prevProps.containerHeight === nextProps.containerHeight
    );
  },
);

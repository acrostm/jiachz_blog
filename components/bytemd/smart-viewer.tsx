"use client";

import React, { useMemo, useRef } from "react";

import { useMemoryManagement } from "./hooks/use-memory-management";
import { OptimizedBytemdViewer } from "./optimized-viewer";
import { PaginatedBytemdViewer } from "./paginated-viewer";
import { VirtualBytemdViewer } from "./virtual-viewer";

type SmartBytemdViewerProps = {
  body: string;
  forceStrategy?: "simple" | "paginated" | "virtual";
};

const THRESHOLDS = {
  // 内容长度阈值
  SIMPLE_MAX: 5000, // 5k字符以下使用简单渲染
  PAGINATION_MAX: 20000, // 20k字符以下使用分页
  // 超过20k字符使用虚拟滚动
};

export const SmartBytemdViewer = ({
  body,
  forceStrategy,
}: SmartBytemdViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 启用内存管理
  const { forceGarbageCollection } = useMemoryManagement(containerRef, {
    enableImageLazyLoading: true,
    enableContentCleanup: true,
    cleanupDelay: 3000,
  });

  // 智能选择渲染策略
  const strategy = useMemo(() => {
    if (forceStrategy) return forceStrategy;

    const contentLength = body.length;
    const linesCount = body.split("\n").length;
    const headingsCount = (body.match(/^#{1,6}\s+/gm) ?? []).length;

    // 内容很短，使用简单渲染
    if (contentLength < THRESHOLDS.SIMPLE_MAX) {
      return "simple";
    }

    // 超长内容或行数特别多，使用虚拟滚动
    if (contentLength > THRESHOLDS.PAGINATION_MAX || linesCount > 1000) {
      return "virtual";
    }

    // 中等长度且有多个标题，适合分页
    if (headingsCount >= 3) {
      return "paginated";
    }

    // 中等长度但标题较少，使用虚拟滚动
    return "virtual";
  }, [body, forceStrategy]);

  // 根据策略渲染对应组件
  return (
    <div ref={containerRef} className="space-y-2">
      {/* 性能优化状态指示 */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded border bg-muted/30 p-2 text-xs text-muted-foreground">
          策略: {strategy} | 长度: {body.length} 字符 | 行数:{" "}
          {body.split("\n").length}
          <button
            onClick={forceGarbageCollection}
            className="ml-2 text-xs underline hover:no-underline"
          >
            强制清理
          </button>
        </div>
      )}

      {/* 内容渲染区域 */}
      {(() => {
        switch (strategy) {
          case "simple":
            return <OptimizedBytemdViewer body={body} lazyLoadPlugins={true} />;

          case "paginated":
            return (
              <PaginatedBytemdViewer body={body} enablePagination={true} />
            );

          case "virtual":
            return (
              <VirtualBytemdViewer
                body={body}
                enableVirtualScroll={true}
                containerHeight={600}
              />
            );

          default:
            return <OptimizedBytemdViewer body={body} lazyLoadPlugins={true} />;
        }
      })()}
    </div>
  );
};

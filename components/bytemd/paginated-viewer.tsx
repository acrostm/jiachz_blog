"use client";

import React, { useRef } from "react";

import { Viewer } from "@bytemd/react";

import { plugins, sanitize } from "./config";
import { useCodeBlockEnhancement } from "./hooks/use-code-block-enhancement";
import { useContentPagination } from "./hooks/use-content-pagination";
import { PaginationNav } from "./pagination-nav";

type PaginatedBytemdViewerProps = {
  body: string;
  enablePagination?: boolean;
};

const PaginatedBytemdViewerComponent = ({
  body,
  enablePagination = true,
}: PaginatedBytemdViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  // 内容分页逻辑
  const pagination = useContentPagination(enablePagination ? body : "");

  // 决定显示的内容：如果启用分页且有多页，显示当前页；否则显示全部
  const displayContent =
    enablePagination && pagination.hasMultiplePages
      ? pagination.currentContent
      : body;

  // 使用自定义 hook 处理代码块增强功能
  const { cleanup } = useCodeBlockEnhancement(viewerRef, displayContent);

  // 组件卸载时清理资源
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="space-y-4">
      {/* 分页导航 - 只在启用分页且有多页时显示 */}
      {enablePagination && (
        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          hasMultiplePages={pagination.hasMultiplePages}
          canGoNext={pagination.canGoNext}
          canGoPrev={pagination.canGoPrev}
          currentPageSections={pagination.currentPageSections}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          onGoToPage={pagination.goToPage}
        />
      )}

      {/* 内容区域 */}
      <div ref={viewerRef}>
        <Viewer value={displayContent} plugins={plugins} sanitize={sanitize} />
      </div>

      {/* 底部导航 - 只在有多页时显示简化版本 */}
      {enablePagination && pagination.hasMultiplePages && (
        <div className="flex items-center justify-between border-t pt-6">
          <button
            onClick={pagination.prevPage}
            disabled={!pagination.canGoPrev}
            className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors
                     enabled:text-foreground enabled:hover:bg-muted
                     disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← 上一页
          </button>

          <span className="text-sm text-muted-foreground">
            第 {pagination.currentPage + 1} 页，共 {pagination.totalPages} 页
          </span>

          <button
            onClick={pagination.nextPage}
            disabled={!pagination.canGoNext}
            className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors
                     enabled:text-foreground enabled:hover:bg-muted
                     disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
};

// 使用 React.memo 缓存组件，避免不必要的重渲染
export const PaginatedBytemdViewer = React.memo(
  PaginatedBytemdViewerComponent,
  (prevProps, nextProps) => {
    // 只有当关键 props 发生变化时才重新渲染
    return (
      prevProps.body === nextProps.body &&
      prevProps.enablePagination === nextProps.enablePagination
    );
  },
);

"use client";

import React from "react";

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  hasMultiplePages: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  currentPageSections: Array<{ id: string; title: string; level: number }>;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage: (page: number) => void;
}

export const PaginationNav = ({
  currentPage,
  totalPages,
  hasMultiplePages,
  canGoNext,
  canGoPrev,
  currentPageSections,
  onNextPage,
  onPrevPage,
  onGoToPage,
}: PaginationNavProps) => {
  if (!hasMultiplePages) {
    return null;
  }

  return (
    <div className="sticky top-4 z-10 mb-6">
      <div className="rounded-lg border bg-background/90 p-4 shadow-sm backdrop-blur-sm">
        {/* 页面导航 */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onPrevPage}
            disabled={!canGoPrev}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
                     enabled:text-foreground enabled:hover:bg-muted
                     disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="上一页"
          >
            <ChevronLeft className="size-4" />
            上一页
          </button>

          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
          </div>

          <button
            onClick={onNextPage}
            disabled={!canGoNext}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
                     enabled:text-foreground enabled:hover:bg-muted
                     disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="下一页"
          >
            下一页
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* 页面选择器 */}
        {totalPages > 2 && (
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => onGoToPage(i)}
                className={`rounded px-2 py-1 text-xs transition-colors
                  ${
                    currentPage === i
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                aria-label={`跳转到第 ${i + 1} 页`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* 当前页面章节预览 */}
        {currentPageSections.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <div className="mb-1 text-xs text-muted-foreground">本页内容：</div>
            <div className="space-y-1">
              {currentPageSections.slice(0, 3).map((section) => (
                <div
                  key={section.id}
                  className="line-clamp-1 text-xs text-foreground"
                  style={{ paddingLeft: `${(section.level - 1) * 8}px` }}
                >
                  {"#".repeat(section.level)} {section.title}
                </div>
              ))}
              {currentPageSections.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  ... 还有 {currentPageSections.length - 3} 个章节
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

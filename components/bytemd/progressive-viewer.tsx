"use client";

import React, { useMemo, useRef, useState } from "react";

import { Viewer } from "@bytemd/react";

import { plugins, sanitize } from "./config";

type ProgressiveBytemdViewerProps = {
  body: string;
};

const MAX_INITIAL_LENGTH = 20000; // 20k字符阈值

export const ProgressiveBytemdViewer = ({ body }: ProgressiveBytemdViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  // 简化的内容处理
  const { displayContent, needsTruncation } = useMemo(() => {
    if (body.length <= MAX_INITIAL_LENGTH || showFullContent) {
      return {
        displayContent: body,
        needsTruncation: body.length > MAX_INITIAL_LENGTH
      };
    }

    // 简单截断到20k字符，尝试在段落边界
    let truncatePoint = MAX_INITIAL_LENGTH;
    const lastParagraph = body.lastIndexOf('\n\n', truncatePoint);
    if (lastParagraph > truncatePoint * 0.8) {
      truncatePoint = lastParagraph;
    }
    
    return {
      displayContent: body.slice(0, truncatePoint) + '\n\n**[内容过长，点击下方按钮查看完整内容]**',
      needsTruncation: true
    };
  }, [body, showFullContent]);

  return (
    <div className="space-y-4">
      {/* 简化的控制面板 */}
      {needsTruncation && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              📖 内容过长（{body.length.toLocaleString()} 字符），已截断显示
            </div>
            {!showFullContent ? (
              <button
                onClick={() => setShowFullContent(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                显示完整内容
              </button>
            ) : (
              <button
                onClick={() => setShowFullContent(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                返回截断模式
              </button>
            )}
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div ref={viewerRef}>
        <Viewer value={displayContent} plugins={plugins} sanitize={sanitize} />
      </div>
    </div>
  );
};
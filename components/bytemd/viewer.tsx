"use client";


import React from "react";

import { Viewer } from "@bytemd/react";

import { plugins, sanitize } from "./config";

type BytemdViewerProps = {
  body: string;
};

export const BytemdViewer = ({ body }: BytemdViewerProps) => {
  return (
    <div>
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

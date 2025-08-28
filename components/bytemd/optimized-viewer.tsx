"use client";

import React, { useEffect, useRef, useState } from "react";

import { Viewer } from "@bytemd/react";

import {
  getCorePlugins,
  getOptimizedPlugins,
  optimizedSanitize,
} from "./config-optimized";
import { useCodeBlockEnhancement } from "./hooks/use-code-block-enhancement";

type OptimizedBytemdViewerProps = {
  body: string;
  lazyLoadPlugins?: boolean;
};

const OptimizedBytemdViewerComponent = ({
  body,
  lazyLoadPlugins = true,
}: OptimizedBytemdViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [plugins, setPlugins] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 使用自定义 hook 处理代码块增强功能
  const { cleanup } = useCodeBlockEnhancement(viewerRef, body);

  // 加载插件
  useEffect(() => {
    let isCancelled = false;

    const loadPlugins = async () => {
      try {
        setIsLoading(true);

        // 先加载核心插件，快速显示基础内容
        const corePlugins = await getCorePlugins();
        if (!isCancelled) {
          setPlugins(corePlugins);
          setIsLoading(false);
        }

        // 如果需要延迟加载，再异步加载完整插件
        if (lazyLoadPlugins) {
          // 使用 setTimeout 确保核心内容先渲染
          setTimeout(() => {
            void (async () => {
              try {
                const fullPlugins = await getOptimizedPlugins(true);
                if (!isCancelled) {
                  setPlugins(fullPlugins);
                }
              } catch (error) {
                // 静默处理插件加载失败
                console.warn("Failed to load full plugins:", error);
              }
            })();
          }, 100);
        } else {
          // 直接加载完整插件
          const fullPlugins = await getOptimizedPlugins(true);
          if (!isCancelled) {
            setPlugins(fullPlugins);
          }
        }
      } catch (error) {
        // 静默处理插件加载失败
        console.error("Failed to load plugins:", error);
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPlugins();

    return () => {
      isCancelled = true;
    };
  }, [lazyLoadPlugins]);

  // 组件卸载时清理资源
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={viewerRef}>
      <Viewer value={body} plugins={plugins} sanitize={optimizedSanitize} />
      {lazyLoadPlugins && (
        <div className="mt-2 text-xs text-muted-foreground">优化加载已启用</div>
      )}
    </div>
  );
};

// 使用 React.memo 缓存组件
export const OptimizedBytemdViewer = React.memo(
  OptimizedBytemdViewerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.body === nextProps.body &&
      prevProps.lazyLoadPlugins === nextProps.lazyLoadPlugins
    );
  },
);

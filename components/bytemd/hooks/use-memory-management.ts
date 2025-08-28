import { useCallback, useEffect, useRef } from "react";

interface MemoryManagementOptions {
  enableImageLazyLoading?: boolean;
  enableContentCleanup?: boolean;
  cleanupDelay?: number;
}

const DEFAULT_OPTIONS: MemoryManagementOptions = {
  enableImageLazyLoading: true,
  enableContentCleanup: true,
  cleanupDelay: 5000, // 5秒后开始清理
};

export const useMemoryManagement = (
  containerRef: React.RefObject<HTMLElement>,
  options: MemoryManagementOptions = {},
) => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const cleanupTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const imageObserversRef = useRef<Map<HTMLImageElement, IntersectionObserver>>(
    new Map(),
  );

  // 图片懒加载
  const setupImageLazyLoading = useCallback(() => {
    if (!finalOptions.enableImageLazyLoading || !containerRef.current) return;

    const container = containerRef.current;
    const images = container.querySelectorAll("img[src]");

    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;

      // 如果图片已经在视口内，跳过
      if (imageElement.complete) return;

      // 保存原始 src
      const originalSrc = imageElement.src;

      // 设置占位符
      imageElement.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEycHgiIGZpbGw9IiNhYWEiPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+";
      imageElement.dataset.originalSrc = originalSrc;

      // 创建 Intersection Observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              const originalSrc = target.dataset.originalSrc;

              if (originalSrc) {
                target.src = originalSrc;
                delete target.dataset.originalSrc;
                observer.unobserve(target);
                imageObserversRef.current.delete(target);
              }
            }
          });
        },
        {
          rootMargin: "100px", // 提前 100px 开始加载
          threshold: 0.01,
        },
      );

      observer.observe(imageElement);
      imageObserversRef.current.set(imageElement, observer);
    });
  }, [containerRef, finalOptions.enableImageLazyLoading]);

  // 清理不可见的内容元素
  const setupContentCleanup = useCallback(() => {
    if (!finalOptions.enableContentCleanup || !containerRef.current) return;

    const container = containerRef.current;

    // 监听滚动事件，清理远离视口的内容
    const handleVisibilityChange = () => {
      const codeBlocks = container.querySelectorAll("pre code");

      codeBlocks.forEach((block) => {
        const rect = block.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isVisible =
          rect.top < windowHeight * 2 && rect.bottom > -windowHeight;

        if (!isVisible) {
          // 如果代码块不在可视范围内，清理其高亮内容
          const codeElement = block as HTMLElement;
          if (codeElement.classList.contains("hljs")) {
            // 保存原始文本，移除高亮
            codeElement.dataset.originalText ??= codeElement.textContent ?? "";
            codeElement.innerHTML = codeElement.dataset.originalText ?? "";
            codeElement.classList.remove("hljs");
          }
        }
      });
    };

    // 节流处理滚动事件
    let scrollTimeout: NodeJS.Timeout;
    const throttledHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleVisibilityChange, 100);
      cleanupTimeoutsRef.current.add(scrollTimeout);
    };

    // 创建 Intersection Observer 来监听内容可见性
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            // 重新应用语法高亮
            if (target.tagName === "CODE" && target.dataset.originalText) {
              // 这里可以重新应用语法高亮
              target.classList.add("hljs");
            }
          }
        });
      },
      {
        rootMargin: "200px",
        threshold: 0,
      },
    );

    // 观察所有代码块
    const codeBlocks = container.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      intersectionObserverRef.current?.observe(block);
    });

    window.addEventListener("scroll", throttledHandler, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledHandler);
    };
  }, [containerRef, finalOptions.enableContentCleanup]);

  // 全局内存清理
  const performGlobalCleanup = useCallback(() => {
    // 清理图片观察器
    imageObserversRef.current.forEach((observer) => {
      observer.disconnect();
    });
    imageObserversRef.current.clear();

    // 清理内容观察器
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
      intersectionObserverRef.current = null;
    }

    // 清理定时器
    cleanupTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    cleanupTimeoutsRef.current.clear();

    // 建议垃圾回收（如果可用）
    if (
      "gc" in window &&
      typeof (window as unknown as { gc?: () => void }).gc === "function"
    ) {
      try {
        (window as unknown as { gc: () => void }).gc();
      } catch {
        // 静默处理
      }
    }
  }, []);

  // 强制垃圾回收（开发环境下）
  const forceGarbageCollection = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      // 在开发环境中允许输出调试信息
      console.log("Forcing garbage collection...");
      performGlobalCleanup();
    }
  }, [performGlobalCleanup]);

  // 监听内存压力事件（现代浏览器）
  useEffect(() => {
    const handleMemoryPressure = () => {
      console.warn("Memory pressure detected, performing cleanup...");
      performGlobalCleanup();
    };

    // 监听内存压力
    if ("memory" in performance) {
      const checkMemory = () => {
        const memory = (
          performance as unknown as {
            memory?: {
              usedJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          }
        ).memory;
        if (memory) {
          const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          if (usageRatio > 0.8) {
            handleMemoryPressure();
          }
        }
      };

      const memoryCheckInterval = setInterval(checkMemory, 10000); // 每10秒检查一次
      cleanupTimeoutsRef.current.add(memoryCheckInterval);

      return () => {
        clearInterval(memoryCheckInterval);
      };
    }
  }, [performGlobalCleanup]);

  // 设置优化功能
  useEffect(() => {
    const cleanup1 = setupImageLazyLoading();
    const cleanup2 = setupContentCleanup();

    return () => {
      cleanup1?.();
      cleanup2?.();
    };
  }, [setupImageLazyLoading, setupContentCleanup]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return performGlobalCleanup;
  }, [performGlobalCleanup]);

  return {
    forceGarbageCollection,
    performGlobalCleanup,
  };
};

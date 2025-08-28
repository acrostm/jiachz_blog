import { useCallback, useMemo, useState } from "react";

interface VirtualItem {
  index: number;
  start: number;
  size: number;
  content: string;
}

interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
}

const DEFAULT_CONFIG: VirtualScrollConfig = {
  itemHeight: 100, // 预估每个内容块的高度
  containerHeight: 800, // 容器高度
  overscan: 3, // 上下额外渲染的项目数量
};

export const useVirtualScroll = (
  content: string,
  enabled = false,
  config: Partial<VirtualScrollConfig> = {},
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );

  // 将内容分割成块
  const contentBlocks = useMemo(() => {
    if (!enabled || !content) return [content];

    // 按段落分割内容，每个块大约包含几个段落
    const paragraphs = content.split("\n\n").filter((p) => p.trim());
    const blocks: string[] = [];
    let currentBlock = "";
    const maxBlockSize = 1000; // 每块最大字符数

    for (const paragraph of paragraphs) {
      if (
        currentBlock.length + paragraph.length > maxBlockSize &&
        currentBlock
      ) {
        blocks.push(currentBlock.trim());
        currentBlock = paragraph;
      } else {
        currentBlock += (currentBlock ? "\n\n" : "") + paragraph;
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock.trim());
    }

    // 如果块数太少，不启用虚拟滚动
    return blocks.length > 10 ? blocks : [content];
  }, [content, enabled]);

  // 计算虚拟项目
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = [];
    let start = 0;

    contentBlocks.forEach((block, index) => {
      const estimatedSize = Math.max(
        finalConfig.itemHeight,
        Math.ceil(block.length / 50) * 20, // 根据内容长度估算高度
      );

      items.push({
        index,
        start,
        size: estimatedSize,
        content: block,
      });

      start += estimatedSize;
    });

    return items;
  }, [contentBlocks, finalConfig.itemHeight]);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    if (!enabled || virtualItems.length <= 10) {
      // 内容不多时，显示全部
      return {
        startIndex: 0,
        endIndex: virtualItems.length - 1,
        visibleItems: virtualItems,
      };
    }

    const { containerHeight, overscan } = finalConfig;
    const scrollBottom = scrollTop + containerHeight;

    let startIndex = 0;
    let endIndex = virtualItems.length - 1;

    // 找到开始索引
    for (let i = 0; i < virtualItems.length; i++) {
      const item = virtualItems[i];
      if (item.start + item.size > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // 找到结束索引
    for (let i = startIndex; i < virtualItems.length; i++) {
      const item = virtualItems[i];
      if (item.start > scrollBottom) {
        endIndex = Math.min(virtualItems.length - 1, i + overscan);
        break;
      }
    }

    const visibleItems = virtualItems.slice(startIndex, endIndex + 1);

    return {
      startIndex,
      endIndex,
      visibleItems,
    };
  }, [scrollTop, virtualItems, finalConfig, enabled]);

  // 滚动处理函数
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  // 总高度
  const totalHeight = useMemo(() => {
    if (!enabled || virtualItems.length <= 10) return "auto";
    return virtualItems.reduce((sum, item) => sum + item.size, 0);
  }, [virtualItems, enabled]);

  // 当前显示的内容
  const displayContent = useMemo(() => {
    if (!enabled || contentBlocks.length <= 10) {
      return content;
    }

    return visibleRange.visibleItems.map((item) => item.content).join("\n\n");
  }, [visibleRange.visibleItems, content, enabled, contentBlocks.length]);

  return {
    enabled: enabled && contentBlocks.length > 10,
    displayContent,
    totalHeight,
    visibleRange,
    handleScroll,
    scrollTop,
    virtualItems: visibleRange.visibleItems,
  };
};

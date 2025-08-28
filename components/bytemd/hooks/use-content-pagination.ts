import { useCallback, useMemo, useState } from "react";

interface HeadingSection {
  id: string;
  title: string;
  level: number;
  content: string;
  wordCount: number;
}

const WORDS_PER_PAGE = 800; // 每页建议字数

export const useContentPagination = (markdownContent: string) => {
  const [currentPage, setCurrentPage] = useState(0);

  // 解析标题和内容分段
  const sections = useMemo(() => {
    if (!markdownContent) return [];

    const lines = markdownContent.split("\n");
    const parsedSections: HeadingSection[] = [];
    let currentSection: HeadingSection | null = null;
    let contentBuffer: string[] = [];

    lines.forEach((line, index) => {
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);

      if (headingMatch) {
        // 保存上一个段落
        if (currentSection) {
          currentSection.content = contentBuffer.join("\n");
          currentSection.wordCount = contentBuffer.join("").length;
          parsedSections.push(currentSection);
        }

        // 创建新段落
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const id = `heading-${index}-${title.replace(/\s+/g, "-").toLowerCase()}`;

        currentSection = {
          id,
          title,
          level,
          content: line, // 包含标题本身
          wordCount: 0,
        };
        contentBuffer = [line];
      } else {
        // 添加到当前段落的内容
        contentBuffer.push(line);
      }
    });

    // 处理最后一个段落
    if (currentSection) {
      currentSection.content = contentBuffer.join("\n");
      currentSection.wordCount = contentBuffer.join("").length;
      parsedSections.push(currentSection);
    }

    // 如果没有标题，将整个内容作为一个段落
    if (parsedSections.length === 0) {
      parsedSections.push({
        id: "content-all",
        title: "全文",
        level: 1,
        content: markdownContent,
        wordCount: markdownContent.length,
      });
    }

    return parsedSections;
  }, [markdownContent]);

  // 智能分页：根据内容长度决定是否需要分页
  const pages = useMemo(() => {
    if (!sections.length) return [];

    const totalWords = sections.reduce(
      (sum, section) => sum + section.wordCount,
      0,
    );

    // 如果总字数较少，不分页
    if (totalWords <= WORDS_PER_PAGE || sections.length <= 3) {
      return [sections];
    }

    // 按字数和标题级别智能分页
    const pages: HeadingSection[][] = [];
    let currentPageSections: HeadingSection[] = [];
    let currentPageWords = 0;

    sections.forEach((section) => {
      const sectionWords = section.wordCount;

      // 如果是一级标题或者当前页面字数超限，开始新页面
      if (
        (section.level <= 2 &&
          currentPageSections.length > 0 &&
          currentPageWords > WORDS_PER_PAGE / 2) ||
        (currentPageWords + sectionWords > WORDS_PER_PAGE &&
          currentPageSections.length > 0)
      ) {
        pages.push([...currentPageSections]);
        currentPageSections = [section];
        currentPageWords = sectionWords;
      } else {
        currentPageSections.push(section);
        currentPageWords += sectionWords;
      }
    });

    // 添加最后一页
    if (currentPageSections.length > 0) {
      pages.push(currentPageSections);
    }

    return pages.length > 1 ? pages : [sections];
  }, [sections]);

  // 当前页面的内容
  const currentContent = useMemo(() => {
    const currentPageSections = pages[currentPage] ?? [];
    return currentPageSections.map((section) => section.content).join("\n\n");
  }, [pages, currentPage]);

  // 导航函数
  const goToPage = useCallback(
    (pageIndex: number) => {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        setCurrentPage(pageIndex);
      }
    },
    [pages.length],
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // 根据标题 ID 跳转到对应页面
  const goToSection = useCallback(
    (sectionId: string) => {
      const pageIndex = pages.findIndex((pageSections) =>
        pageSections.some((section) => section.id === sectionId),
      );
      if (pageIndex !== -1) {
        setCurrentPage(pageIndex);
      }
    },
    [pages],
  );

  return {
    sections,
    pages,
    currentPage,
    currentContent,
    totalPages: pages.length,
    hasMultiplePages: pages.length > 1,
    canGoNext: currentPage < pages.length - 1,
    canGoPrev: currentPage > 0,
    goToPage,
    nextPage,
    prevPage,
    goToSection,
    currentPageSections: pages[currentPage] ?? [],
  };
};

import React from "react";

import Link from "next/link";

import { CalendarDays, Eye, MapPin, MoveLeft, User } from "lucide-react";

import { type OptionItem } from "@/types";

import { MarkdownEnhancer } from "@/components/bytemd/markdown-enhancer";
import { DetailSidebar } from "@/components/detail-sidebar";
import { MarkdownTOC } from "@/components/markdown-toc";
import { GsapReveal } from "@/components/motion/gsap-reveal";
import { Wrapper } from "@/components/wrapper";

import { PATHS, PLACEHOLDER_TEXT } from "@/constants";
import { TagList } from "@/features/tag";
import { cn, prettyDateWithWeekday } from "@/lib/utils";

import { ArticleReadingProgress } from "../components/article-reading-progress";
import { BlogCoverArt } from "../components/blog-cover-art";
import { BlogEventTracking } from "../components/blog-event-tracking";
import { type Blog } from "../types";

type BlogDetailProps = {
  blog: Blog;
  markdown: {
    html: string;
    toc: OptionItem<string>[];
  };
  uv?: number;
};

export const BlogDetailPage = ({ blog, markdown, uv = 0 }: BlogDetailProps) => {
  const markdownBodyID = `blog-markdown-${blog.id}`;

  return (
    <Wrapper className="flex flex-col px-6 pb-24 pt-8">
      <ArticleReadingProgress />
      <GsapReveal>
        <Link
          href={PATHS.SITE_BLOG}
          data-gsap-reveal
          className={cn(
            "future-muted mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--future-line)] bg-white/[0.04] px-4 py-2 text-sm transition-colors",
            "hover:text-[var(--future-ink)]",
          )}
        >
          <MoveLeft className="size-3.5" />
          <span>返回博客</span>
        </Link>

        <section
          data-gsap-reveal
          className="future-panel-strong relative isolate overflow-hidden rounded-[2rem] p-5 md:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgb(223_114_69/0.18),transparent_32%),radial-gradient(circle_at_82%_24%,rgb(34_211_238/0.16),transparent_28%)]" />
          <div className="relative z-[1] grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
            <div className="flex min-h-[420px] flex-col justify-between px-1 py-2 md:px-3">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="future-label">Article Plate</span>
                  <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
                </div>
                <h1 className="future-heading max-w-4xl break-words text-5xl font-black leading-[0.98] md:text-7xl">
                  {blog.title}
                </h1>
                <p className="future-muted mt-6 max-w-2xl text-base leading-8 md:text-lg">
                  {blog.description}
                </p>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <MetaItem
                  icon={<CalendarDays className="size-4" />}
                  label="Published"
                  value={prettyDateWithWeekday(blog.createdAt)}
                />
                <MetaItem
                  icon={<Eye className="size-4" />}
                  label="Views"
                  value={`${uv || PLACEHOLDER_TEXT} 人浏览过`}
                />
                {blog.author && (
                  <MetaItem
                    icon={<User className="size-4" />}
                    label="Author"
                    value={blog.author}
                  />
                )}
                {blog.creatorLocation && (
                  <MetaItem
                    icon={<MapPin className="size-4" />}
                    label="Location"
                    value={blog.creatorLocation}
                  />
                )}
              </div>
            </div>

            <BlogCoverArt
              title={blog.title}
              cover={blog.cover}
              className="min-h-[360px] lg:min-h-full"
              priority
            />
          </div>
        </section>

        <div
          data-gsap-reveal
          className="mt-8 grid gap-8 wrapper:grid-cols-[minmax(0,1fr)_240px]"
        >
          <article className="future-panel-strong overflow-hidden rounded-[2rem] px-5 py-7 md:p-10">
            <div
              id={markdownBodyID}
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: markdown.html }}
            />
            <MarkdownEnhancer markdownBodyID={markdownBodyID} />

            <div className="mt-12 border-t border-[var(--future-line)] pt-8">
              <p className="future-label mb-4">Tagged</p>
              <TagList tags={blog.tags} />
            </div>
          </article>

          <DetailSidebar>
            <MarkdownTOC tocList={markdown.toc} />
          </DetailSidebar>
        </div>
      </GsapReveal>
      <BlogEventTracking blogID={blog.id} />
    </Wrapper>
  );
};

const MetaItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2 text-[var(--future-accent)]">
        {icon}
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em]">
          {label}
        </span>
      </div>
      <div className="future-muted text-sm leading-6">{value}</div>
    </div>
  );
};

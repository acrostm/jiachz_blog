"use client";

import React from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  Calendar,
  Eye,
  LockKeyhole,
  MapPin,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { LoginPrompt } from "@/components/login-prompt";

import { PATHS, PLACEHOLDER_TEXT } from "@/constants";
import { TagPrefixIcon } from "@/features/tag";
import { useAuth } from "@/hooks";
import { cn, prettyDate } from "@/lib/utils";
import { formatNum } from "@/utils";

import { BlogCoverArt } from "./blog-cover-art";

import { type Blog } from "../types";

type BlogListItemProps = {
  blog: Blog;
  uvMap?: Record<string, number>;
  index?: number;
};

export const BlogListItem = ({ blog, uvMap, index = 0 }: BlogListItemProps) => {
  const { isAuthenticated, isVerified } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);
  const locked = !isAuthenticated || !isVerified;

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginPrompt(true);
    } else if (!isVerified) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
  };

  return (
    <>
      <Link
        href={`${PATHS.SITE_BLOG}/${blog.slug}`}
        onClick={handleClick}
        aria-disabled={locked}
        className={cn(
          "group future-panel block h-full overflow-hidden rounded-[1.5rem] p-3 text-[var(--future-ink)] transition duration-500",
          "hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--future-accent)_46%,transparent)] hover:bg-white/[0.06]",
          locked && "cursor-not-allowed opacity-55 hover:translate-y-0",
        )}
      >
        <BlogCoverArt
          title={blog.title}
          cover={blog.cover}
          index={index}
          priority={index < 2}
          className="aspect-[16/10]"
        />

        <div className="px-3 pb-3 pt-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <ul className="flex min-w-0 flex-wrap gap-2">
              {blog.tags.slice(0, 3).map((tag) => (
                <li key={tag.id} className="min-w-0">
                  <Badge
                    variant="outline"
                    className="border-[var(--future-line)] bg-white/[0.04] font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--future-muted)]"
                  >
                    <TagPrefixIcon tag={tag} className="mr-1 size-3" />
                    {tag.name}
                  </Badge>
                </li>
              ))}
            </ul>
            {locked && (
              <LockKeyhole className="size-4 shrink-0 text-[var(--future-accent)]" />
            )}
          </div>

          <h4 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.035em]">
            {blog.title}
          </h4>
          <p className="future-muted mt-3 line-clamp-2 text-sm leading-6">
            {blog.description}
          </p>

          <div className="future-muted mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs">
            <div className="flex h-5 items-center gap-1.5">
              <Calendar className="size-3" />
              <time dateTime={blog.createdAt.toISOString()}>
                {prettyDate(blog.createdAt)}
              </time>
            </div>
            <div className="flex h-5 items-center gap-1.5">
              <Eye className="size-3" />
              <span>
                {formatNum(uvMap?.[blog.id])
                  ? formatNum(uvMap?.[blog.id])
                  : PLACEHOLDER_TEXT}
              </span>
            </div>
            {blog.author && (
              <div className="flex h-5 items-center gap-1.5">
                <User className="size-3" />
                <span>{blog.author}</span>
              </div>
            )}
            {blog.creatorLocation && (
              <div className="flex h-5 items-center gap-1.5">
                <MapPin className="size-3" />
                <span>{blog.creatorLocation}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[var(--future-line)] pt-4">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--future-accent)]">
              Read field note
            </span>
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
      <LoginPrompt open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </>
  );
};

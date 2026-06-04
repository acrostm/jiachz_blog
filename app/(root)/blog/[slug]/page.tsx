import { notFound } from "next/navigation";

import { isNil } from "lodash-es";

import { renderMarkdown } from "@/components/bytemd/render-markdown";

import { BlogDetailPage, getPublishedBlogBySlug } from "@/features/blog";
import { getBlogUV } from "@/features/statistics";

export const revalidate = 60;

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { blog } = await getPublishedBlogBySlug(slug);
  if (isNil(blog)) {
    return notFound();
  }

  const uv = await getBlogUV(blog.id);
  const markdown = renderMarkdown(blog.body || "");

  return <BlogDetailPage blog={blog} markdown={markdown} uv={uv} />;
}

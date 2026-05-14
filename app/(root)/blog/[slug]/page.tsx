import { notFound } from "next/navigation";

import { isNil } from "lodash-es";

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

  return <BlogDetailPage blog={blog} uv={uv} />;
}

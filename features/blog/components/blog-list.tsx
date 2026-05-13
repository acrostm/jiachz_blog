import { IllustrationNoContent } from "@/components/illustrations";

import { BlogListItem } from "./blog-list-item";

import { type Blog } from "../types";

type BlogListProps = {
  blogs: Blog[];
  uvMap?: Record<string, number>;
};

export const BlogList = ({ blogs, uvMap }: BlogListProps) => {
  if (!blogs.length) {
    return (
      <div className="grid place-content-center gap-8">
        <IllustrationNoContent className="size-[30vh]" />
        <h3 className="text-center text-2xl font-semibold tracking-tight">
          暂无Blog
        </h3>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {blogs.map((el, idx) => (
        <li key={el.id} data-gsap-reveal>
          <BlogListItem blog={el} uvMap={uvMap} index={idx} />
        </li>
      ))}
    </ul>
  );
};

import type { Metadata } from "next";

import { NewsPage, getNewsDirectory } from "@/features/news";

export const metadata: Metadata = {
  title: "News",
  description: "聚合实时热榜、技术社区和开源趋势",
};

export default function Page() {
  const directory = getNewsDirectory();

  return <NewsPage columns={directory.columns} sources={directory.sources} />;
}

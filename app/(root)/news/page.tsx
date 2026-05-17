import type { Metadata } from "next";

import { NewsPage, getNewsDirectory } from "@/features/news";

export const metadata: Metadata = {
  title: "News",
  description: "关注、最热和实时新闻源聚合",
};

export default function Page() {
  const directory = getNewsDirectory();

  return <NewsPage sources={directory.sources} />;
}

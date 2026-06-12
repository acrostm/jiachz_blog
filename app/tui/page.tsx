import { type Metadata } from "next";

import { TuiPortfolio } from "@/features/tui";

export const metadata: Metadata = {
  title: "tui",
  description: "A hidden terminal-style profile for Jiach.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <TuiPortfolio />;
}

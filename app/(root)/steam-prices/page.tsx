import type { Metadata } from "next";

import { SteamPricesPage } from "@/features/steam-prices";

export const metadata: Metadata = {
  title: "Steam Prices",
  description: "Steam 多区官方价格实时比价",
};

export default function Page() {
  return <SteamPricesPage />;
}

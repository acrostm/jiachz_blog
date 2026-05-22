export type SteamSearchResult = {
  appid: number;
  name: string;
  type: string;
  image: string | null;
  price: string | null;
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
};

export type SteamPriceStatus =
  | "available"
  | "error"
  | "exchange_missing"
  | "free"
  | "no_price"
  | "unavailable";

export type SteamRegionPrice = {
  id: string;
  cc: string;
  flag: string;
  region: string;
  rank: number | null;
  currency: string | null;
  officialPrice: number | null;
  officialFormatted: string;
  cnyPrice: number | null;
  cnyFormatted: string;
  vsChina: number | null;
  vsChinaFormatted: string;
  discountPercent: number;
  status: SteamPriceStatus;
  statusLabel: string;
  error: string | null;
};

export type SteamPricesResponse = {
  appid: number;
  name: string;
  type: string;
  image: string | null;
  steamUrl: string;
  queriedAt: string;
  supportedChinese: boolean;
  chinaPrice: number | null;
  chinaPriceFormatted: string;
  conclusion: string;
  ratesUpdatedAt: string | null;
  regions: SteamRegionPrice[];
};

export type SteamDealItem = {
  appid: number;
  name: string;
  image: string | null;
  steamUrl: string;
  discountPercent: number;
  originalPrice: number | null;
  finalPrice: number | null;
  originalFormatted: string;
  finalFormatted: string;
  discountEndsAt: string | null;
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
};

export type SteamDealsResponse = {
  queriedAt: string;
  source: string;
  giveaways: SteamDealItem[];
  discounts: SteamDealItem[];
};

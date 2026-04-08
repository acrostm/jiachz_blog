import { type CurrencyOption } from "../types";

export const popularCurrencies: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
];

export const allCurrencies: CurrencyOption[] = [
  ...popularCurrencies,
  { code: "CHF", name: "瑞士法郎", symbol: "CHF" },
  { code: "SEK", name: "瑞典克朗", symbol: "kr" },
  { code: "NOK", name: "挪威克朗", symbol: "kr" },
  { code: "DKK", name: "丹麦克朗", symbol: "kr" },
  { code: "NZD", name: "新西兰元", symbol: "NZ$" },
  { code: "ZAR", name: "南非兰特", symbol: "R" },
  { code: "BRL", name: "巴西雷亚尔", symbol: "R$" },
  { code: "RUB", name: "俄罗斯卢布", symbol: "₽" },
  { code: "INR", name: "印度卢比", symbol: "₹" },
  { code: "THB", name: "泰铢", symbol: "฿" },
  { code: "MYR", name: "马来西亚令吉", symbol: "RM" },
  { code: "PHP", name: "菲律宾比索", symbol: "₱" },
  { code: "IDR", name: "印尼盾", symbol: "Rp" },
  { code: "VND", name: "越南盾", symbol: "₫" },
];

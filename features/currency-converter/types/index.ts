export type ExchangeRates = Record<string, number>;

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

export interface ExchangeRateResponse {
  base_code: string;
  target_code: string;
  conversion_rate: number;
  conversion_result?: number;
  time_last_update_utc?: string;
}

export interface CurrencyConverterState {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  isLoading: boolean;
  error: string | null;
  rates: ExchangeRates;
  lastUpdated: string | null;
}

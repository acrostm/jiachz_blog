"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleLineChart } from "@/components/ui/simple-chart";

import { createExchangeRateService } from "../api/exchange-rate";
import { popularCurrencies } from "../data/currencies";
import type { CurrencyConverterState } from "../types";

interface CurrencyConverterProps {
  apiKey?: string;
}

interface ChartDataPoint {
  date: string;
  rate: number;
}

export function CurrencyConverter({ apiKey }: CurrencyConverterProps) {
  const [state, setState] = useState<CurrencyConverterState>({
    fromCurrency: "CAD",
    toCurrency: "USD",
    amount: 5545,
    result: 0,
    isLoading: false,
    error: null,
    rates: {},
    lastUpdated: null,
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentRate, setCurrentRate] = useState<number>(1);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const exchangeService = useMemo(
    () => createExchangeRateService(apiKey),
    [apiKey],
  );

  // Fetch real exchange rate data with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void (async () => {
        if (!exchangeService) return;

        setIsLoadingChart(true);
        setState((prev) => ({ ...prev, error: null }));

        try {
          // Handle same currency case
          if (state.fromCurrency === state.toCurrency) {
            setCurrentRate(1);
            setChartData([]);
            setState((prev) => ({
              ...prev,
              lastUpdated: new Date().toISOString(),
              error: null,
            }));
            return;
          }

          // Fetch current exchange rate and historical data in parallel
          const [rateResponse, historicalData] = await Promise.all([
            exchangeService.convertCurrency(
              state.fromCurrency,
              state.toCurrency,
              1,
            ),
            exchangeService.getHistoricalData(
              state.fromCurrency,
              state.toCurrency,
              30,
            ),
          ]);

          setCurrentRate(rateResponse.conversion_rate);
          setChartData(historicalData);

          // Update last updated time
          setState((prev) => ({
            ...prev,
            lastUpdated:
              rateResponse.time_last_update_utc ?? new Date().toISOString(),
            error: null,
          }));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch exchange rate data:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch exchange rate data";

          setState((prev) => ({
            ...prev,
            error: errorMessage,
          }));

          // Set fallback current rate for same currency
          if (state.fromCurrency === state.toCurrency) {
            setCurrentRate(1);
          }
        } finally {
          setIsLoadingChart(false);
        }
      })();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.fromCurrency, state.toCurrency, exchangeService]);

  const handleConvert = async () => {
    if (!exchangeService) {
      setState((prev) => ({
        ...prev,
        error:
          "Exchange rate service not available. Please check API configuration.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await exchangeService.convertCurrency(
        state.fromCurrency,
        state.toCurrency,
        state.amount,
      );

      setState((prev) => ({
        ...prev,
        result: response.conversion_result || 0,
        lastUpdated: response.time_last_update_utc || new Date().toISOString(),
        isLoading: false,
      }));

      setCurrentRate(response.conversion_rate);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Conversion failed";
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  };

  const handleSwapCurrencies = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency,
      amount: prev.result,
      result: prev.amount,
    }));
    setCurrentRate(1 / currentRate);
  }, [currentRate]);

  const handleFromAmountChange = useCallback((value: string) => {
    const numericValue = parseFloat(value) || 0;
    setState((prev) => ({ ...prev, amount: numericValue }));
  }, []);

  const handleToAmountChange = useCallback(
    (value: string) => {
      const numericValue = parseFloat(value) || 0;
      const newFromAmount = currentRate > 0 ? numericValue / currentRate : 0;
      setState((prev) => ({
        ...prev,
        amount: newFromAmount,
        result: numericValue,
      }));
    },
    [currentRate],
  );

  const currencyOptions = useMemo(
    () =>
      popularCurrencies.map((currency) => (
        <SelectItem key={currency.code} value={currency.code}>
          <span className="flex items-center gap-2">
            <span className="text-sm">{currency.flag}</span>
            <span className="font-semibold">{currency.code}</span>
          </span>
        </SelectItem>
      )),
    [],
  );

  const handleFromCurrencyChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, fromCurrency: value }));
  }, []);

  const handleToCurrencyChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, toCurrency: value }));
  }, []);

  // Auto-convert when amount or currencies change
  useEffect(() => {
    if (state.amount > 0 && currentRate > 0) {
      const result = state.amount * currentRate;
      setState((prev) => {
        if (Math.abs(prev.result - result) > 0.001) {
          return { ...prev, result };
        }
        return prev;
      });
    }
  }, [state.amount, currentRate]);

  return (
    <div className="mx-auto space-y-6">
      {/* Chart Section */}
      <div className="relative mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-6">
            {/* Current Rate Display */}
            <div className="mb-6">
              <div className="mb-2 text-3xl font-bold text-green-600">
                {currentRate.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground">
                1 {state.fromCurrency} = {currentRate.toFixed(4)}{" "}
                {state.toCurrency}
              </div>
            </div>

            {/* Chart */}
            <div className="relative mb-4">
              {isLoadingChart ? (
                <div className="flex h-64 items-center justify-center rounded-lg bg-muted/20">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="size-8 animate-spin rounded-full border-b-2 border-green-600"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading historical data...
                    </p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <SimpleLineChart
                  data={chartData}
                  strokeColor="#16a34a"
                  strokeWidth={2}
                  className="size-full"
                  baseCurrency={state.fromCurrency}
                  targetCurrency={state.toCurrency}
                  showHoverInParent={true}
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg bg-muted/20">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No historical data available
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Historical data requires a paid API plan
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Conversion Section */}
      <div className="mx-auto max-w-md space-y-6">
        {/* From Currency */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Input
                type="number"
                value={state.amount || ""}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className="border-none bg-transparent p-0 text-left text-2xl font-bold [-moz-appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="0"
              />
              <div className="flex items-center space-x-2">
                <Select
                  value={state.fromCurrency}
                  onValueChange={handleFromCurrencyChange}
                >
                  <SelectTrigger className="border-none bg-transparent text-lg font-semibold focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{currencyOptions}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapCurrencies}
            className="rounded-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <ArrowUpDown className="size-4" />
          </Button>
        </div>

        {/* To Currency */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Input
                type="number"
                value={state.result ? state.result.toFixed(3) : ""}
                onChange={(e) => handleToAmountChange(e.target.value)}
                className="border-none bg-transparent p-0 text-left text-2xl font-bold [-moz-appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="0"
              />
              <div className="flex items-center space-x-2">
                <Select
                  value={state.toCurrency}
                  onValueChange={handleToCurrencyChange}
                >
                  <SelectTrigger className="border-none bg-transparent text-lg font-semibold focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{currencyOptions}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Convert Button */}
        <Button
          className="w-full rounded-2xl bg-green-600 py-6 text-lg text-white hover:bg-green-700"
          onClick={handleConvert}
          disabled={state.isLoading}
        >
          {state.isLoading ? "Converting..." : "Convert"}
        </Button>

        {/* Error Display */}
        {state.error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Source Info */}
        <div className="space-y-1 text-center text-xs text-muted-foreground">
          {state.lastUpdated && (
            <div>
              Last updated: {new Date(state.lastUpdated).toLocaleString()}
            </div>
          )}
          {!exchangeService && (
            <div className="text-amber-600 dark:text-amber-400">
              ⚠️ API key not configured - using demo data
            </div>
          )}
          {exchangeService && chartData.length > 0 && chartData.length < 15 && (
            <div className="text-blue-600 dark:text-blue-400">
              📊 Using fallback historical data (real data requires paid plan)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

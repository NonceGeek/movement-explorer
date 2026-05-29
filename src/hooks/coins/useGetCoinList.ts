"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGetVerifiedTokens } from "./useGetVerifiedTokens";
import { CoinDescription } from "./types";

export function useGetCoinList(options?: { retry?: number | boolean }) {
  const { data: verifiedTokens } = useGetVerifiedTokens();

  // Stable placeholder: token metadata without prices (available immediately)
  const placeholderCoins = useMemo(() => {
    if (!verifiedTokens) return { data: [] as CoinDescription[] };
    return { data: Object.values(verifiedTokens) };
  }, [verifiedTokens]);

  const tokenCount = verifiedTokens ? Object.keys(verifiedTokens).length : 0;

  return useQuery<{ data: CoinDescription[] }, ResponseError>({
    queryKey: ["coinList", tokenCount],
    enabled: !!verifiedTokens,
    placeholderData: placeholderCoins,
    queryFn: async (): Promise<{ data: CoinDescription[] }> => {
      if (!verifiedTokens) return { data: [] };

      const coins = Object.values(verifiedTokens);
      const coinGeckoIds = Array.from(
        new Set(
          coins
            .map((coin) => coin.coinGeckoId)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      // Fetch prices through the local BFF to share cache across users.
      const query = {
        vs_currencies: "usd",
        ids: coinGeckoIds.join(","),
      };
      const queryString = new URLSearchParams(query);
      const url = `/api/prices/simple?${queryString}`;

      let priceData: Record<string, { usd: number }> = {};
      try {
        const response = await fetch(url, { method: "GET" });
        priceData = await response.json();
      } catch (error) {
        console.warn("Failed to fetch coin prices:", error);
        return { data: coins };
      }

      // Map to CoinDescription and add usdPrice
      const coinDescriptions: CoinDescription[] = coins.map((coin) => ({
        ...coin,
        usdPrice: coin.coinGeckoId
          ? (priceData[coin.coinGeckoId]?.usd?.toString() ?? null)
          : null,
      }));

      return { data: coinDescriptions };
    },
    retry: options?.retry ?? false,
  });
}

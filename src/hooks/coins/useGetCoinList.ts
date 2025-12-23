"use client";

import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGetVerifiedTokens } from "./useGetVerifiedTokens";
import { CoinDescription } from "./types";

export function useGetCoinList(options?: { retry?: number | boolean }) {
  const { data: verifiedTokens } = useGetVerifiedTokens();

  return useQuery<{ data: CoinDescription[] }, ResponseError>({
    queryKey: ["coinList", verifiedTokens],
    enabled: !!verifiedTokens,
    initialData: { data: [] },
    queryFn: async (): Promise<{ data: CoinDescription[] }> => {
      if (!verifiedTokens) return { data: [] };

      const coins = Object.values(verifiedTokens);
      const coinGeckoIds = coins
        .map((coin) => coin.coinGeckoId)
        .filter((id) => id);

      // Fetch prices from CoinGecko
      const end_point = "https://api.coingecko.com/api/v3/simple/price";
      const query = {
        vs_currencies: "usd",
        ids: coinGeckoIds.join(","),
      };
      const queryString = new URLSearchParams(query);
      const url = `${end_point}?${queryString}`;

      let priceData: Record<string, { usd: number }> = {};
      try {
        const response = await fetch(url, { method: "GET" });
        priceData = await response.json();
      } catch (error) {
        console.error("Failed to fetch coin prices:", error);
        return { data: coins };
      }

      // Map to CoinDescription and add usdPrice
      const coinDescriptions: CoinDescription[] = coins.map((coin) => ({
        ...coin,
        usdPrice: coin.coinGeckoId
          ? priceData[coin.coinGeckoId]?.usd?.toString() ?? null
          : null,
      }));

      return { data: coinDescriptions };
    },
    retry: options?.retry ?? false,
  });
}

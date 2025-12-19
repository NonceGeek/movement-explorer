import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGetVerifiedTokens } from "./useGetVerifiedTokens";
import { CoinDescription } from "../../types";

export function useGetCoinList(options?: { retry?: number | boolean }) {
  const { data: verifiedTokens } = useGetVerifiedTokens();

  return useQuery<{ data: CoinDescription[] }, ResponseError>({
    queryKey: ["coinList", verifiedTokens],
    enabled: !!verifiedTokens, // Only run when tokens are loaded
    initialData: { data: [] },
    queryFn: async (): Promise<{ data: CoinDescription[] }> => {
      if (!verifiedTokens) return { data: [] };

      const coins = Object.values(verifiedTokens) as CoinDescription[];
      const coinGeckoIds = coins
        .map((coin) => coin.coinGeckoId)
        .filter((id) => id);

      // TODO: fetch from coinmarketcap
      const end_point = "https://api.coingecko.com/api/v3/simple/price";
      const query = {
        vs_currencies: "usd",
        ids: coinGeckoIds.join(","),
      };
      const queryString = new URLSearchParams(query);
      const url = `${end_point}?${queryString}`;

      let ret: { movement: { usd: number } } = { movement: { usd: 0 } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let retAny: any = ret;

      try {
        const res = await fetch(url, { method: "GET" });
        retAny = await res.json();
      } catch (error) {
        console.error("Failed to fetch coin prices:", error);
        return { data: coins };
      }

      // Map to CoinDescription and add usdPrice
      const coinDescriptions: CoinDescription[] = coins.map((coin) => ({
        ...coin,
        usdPrice: coin.coinGeckoId
          ? retAny[coin.coinGeckoId]?.usd?.toString() ?? null
          : null,
      }));

      return { data: coinDescriptions };
    },
    retry: options?.retry ?? false,
  });
}

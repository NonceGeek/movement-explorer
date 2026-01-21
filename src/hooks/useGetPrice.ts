import { useQuery } from "@tanstack/react-query";

const COINGECKO_API_ENDPOINT = "https://api.coingecko.com/api/v3/simple/price";

/**
 * Fetches the USD price for a cryptocurrency using its CoinGecko ID.
 *
 * @param coinId - The CoinGecko ID of the cryptocurrency (defaults to "movement")
 * @returns The USD price of the cryptocurrency or null if the price fetch fails
 */
export async function getPrice(
  coinId: string = "movement",
): Promise<number | null> {
  const query = {
    ids: coinId,
    vs_currencies: "usd",
  };

  const queryString = new URLSearchParams(query);
  const url = `${COINGECKO_API_ENDPOINT}?${queryString}`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return Number(data[coinId]?.usd || 0);
  } catch (error) {
    console.error(`Error fetching ${coinId} price from CoinGecko:`, error);
    return null;
  }
}

/**
 * Fetches the USD price for a cryptocurrency using its CoinGecko ID.
 *
 * @param coinId - The CoinGecko ID of the cryptocurrency (defaults to "movement")
 * @returns React Query result object containing the price data and query state
 */
export function useGetPrice(coinId: string = "movement") {
  return useQuery({
    queryKey: ["price", coinId],
    queryFn: () => getPrice(coinId),
    refetchInterval: 60000, // Refetch every minute
  });
}

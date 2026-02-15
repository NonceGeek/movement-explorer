import { useQuery } from "@tanstack/react-query";
import { COINGECKO_API_ENDPOINT } from "../constants";

export interface PriceData {
  price: number | null;
  marketCap: number | null;
  priceChange24h: number | null; // 24-hour price change percentage
}

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

/**
 * Fetches the USD price and market cap for a cryptocurrency using its CoinGecko ID.
 *
 * @param coinId - The CoinGecko ID of the cryptocurrency (defaults to "movement")
 * @returns Object containing price and marketCap, or null values if the fetch fails
 */
export async function getPriceWithMarketCap(
  coinId: string = "movement",
): Promise<PriceData> {
  const query = {
    ids: coinId,
    vs_currencies: "usd",
    include_market_cap: "true",
    include_24hr_change: "true", // Include 24-hour price change percentage
  };

  const queryString = new URLSearchParams(query);
  const url = `${COINGECKO_API_ENDPOINT}?${queryString}`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return { price: null, marketCap: null, priceChange24h: null };
    }

    const data = await response.json();
    return {
      price: Number(data[coinId]?.usd || 0) || null,
      marketCap: Number(data[coinId]?.usd_market_cap || 0) || null,
      priceChange24h: Number(data[coinId]?.usd_24h_change || 0) || null,
    };
  } catch (error) {
    console.error(`Error fetching ${coinId} data from CoinGecko:`, error);
    return { price: null, marketCap: null, priceChange24h: null };
  }
}

/**
 * React Query hook to fetch USD price and market cap for a cryptocurrency.
 *
 * @param coinId - The CoinGecko ID of the cryptocurrency (defaults to "movement")
 * @returns React Query result object containing price and market cap data
 */
export function useGetPriceWithMarketCap(coinId: string = "movement") {
  return useQuery({
    queryKey: ["priceWithMarketCap", coinId],
    queryFn: () => getPriceWithMarketCap(coinId),
    refetchInterval: 60000, // Refetch every minute
  });
}

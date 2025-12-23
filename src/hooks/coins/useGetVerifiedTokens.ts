"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CoinDescription,
  MovementVerifiedToken,
  HardCodedCoins,
} from "./types";

export function useGetVerifiedTokens() {
  return useQuery<Record<string, CoinDescription>>({
    queryKey: ["verified_tokens"],
    placeholderData: HardCodedCoins,
    refetchOnMount: true,
    queryFn: async () => {
      let movementRes;
      try {
        movementRes = await fetch(
          "https://raw.githubusercontent.com/movementlabsxyz/movement-tokens/refs/heads/main/tokens.json"
        );
      } catch (error) {
        console.error("Failed to fetch Movement Labs verified tokens:", error);
        return HardCodedCoins;
      }

      const panoraTokens = HardCodedCoins;

      if (!movementRes.ok) {
        console.error("Failed to fetch Movement Labs verified tokens");
        return HardCodedCoins;
      }

      const movementTokens: Record<string, MovementVerifiedToken> =
        await movementRes.json();

      const normalizedMovementTokens: Record<string, CoinDescription> = {};

      // Convert MovementVerifiedToken to CoinDescription format
      for (const [faAddress, token] of Object.entries(movementTokens)) {
        normalizedMovementTokens[faAddress] = {
          ...token,
          faAddress,
          bridge: token.bridge ?? null,
          panoraSymbol: null,
          category: "Verified",
          isInPanoraTokenList: true,
          isBanned: false,
          panoraOrderIndex: 5,
          panoraIndex: 5,
          coinGeckoId: token.coinGeckoId || null,
          coinMarketCapId: token.coinMarketCapId || null,
          native: false,
          panoraUI: false,
          usdPrice: null,
          panoraTags: ["Verified"],
        };
      }

      // Merge both records (repository tokens take priority over hardcoded tokens)
      return {
        ...panoraTokens,
        ...normalizedMovementTokens,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

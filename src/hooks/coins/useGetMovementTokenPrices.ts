"use client";

import { useQuery } from "@tanstack/react-query";

export type MovementTokenPrices = Record<string, number>;

function normalizeAssetId(assetId: string): string | null {
  const trimmed = assetId.trim();
  if (!trimmed || trimmed.includes("::")) return null;

  const normalized = trimmed.toLowerCase();
  if (!/^0x[0-9a-f]+$/.test(normalized)) return null;

  return normalized;
}

async function getMovementTokenPrices(
  assetIds: string[],
): Promise<MovementTokenPrices> {
  const query = new URLSearchParams({ ids: assetIds.join(",") });
  const response = await fetch(`/api/prices/movement?${query}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch token prices: ${response.status}`);
  }

  const data = (await response.json()) as { prices?: MovementTokenPrices };
  return data.prices ?? {};
}

export function useGetMovementTokenPrices(assetIds: string[]) {
  const normalizedAssetIds = Array.from(
    new Set(
      assetIds
        .map(normalizeAssetId)
        .filter((assetId): assetId is string => Boolean(assetId)),
    ),
  ).sort();

  return useQuery({
    queryKey: ["movementTokenPrices", normalizedAssetIds],
    queryFn: () => getMovementTokenPrices(normalizedAssetIds),
    enabled: normalizedAssetIds.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}

import { Types } from "aptos";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { view } from "../../services";

export type FaMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  icon_uri: string;
  project_uri: string;
};

const FA_METADATA_CACHE_LIMIT = 200;
const faMetadataCache = new Map<string, FaMetadata>();

function getCachedFaMetadata(key: string): FaMetadata | null {
  const value = faMetadataCache.get(key);
  if (!value) return null;
  // Refresh LRU order
  faMetadataCache.delete(key);
  faMetadataCache.set(key, value);
  return value;
}

function setCachedFaMetadata(key: string, value: FaMetadata) {
  if (faMetadataCache.has(key)) {
    faMetadataCache.delete(key);
  }
  faMetadataCache.set(key, value);
  if (faMetadataCache.size > FA_METADATA_CACHE_LIMIT) {
    const oldestKey = faMetadataCache.keys().next().value as string | undefined;
    if (oldestKey) {
      faMetadataCache.delete(oldestKey);
    }
  }
}
const FA_METADATA_STALE_MS = 10 * 60 * 1000;
const FA_METADATA_GC_MS = 60 * 60 * 1000;

export function useGetFaMetadata(address: string): {
  isLoading: boolean;
  data: FaMetadata | null;
} {
  const { network_value, aptos_client } = useGlobalStore();
  const cacheKey = `${network_value}:${address}`;
  const cached = getCachedFaMetadata(cacheKey);
  const request: Types.ViewRequest = {
    function: "0x1::fungible_asset::metadata",
    type_arguments: ["0x1::object::ObjectCore"],
    arguments: [address],
  };

  const { data, isLoading } = useQuery<Types.MoveValue[], ResponseError>({
    queryKey: ["faMetadata", cacheKey],
    queryFn: () => view(request, aptos_client),
    refetchOnWindowFocus: false,
    enabled: Boolean(address) && !cached,
    staleTime: FA_METADATA_STALE_MS,
    gcTime: FA_METADATA_GC_MS,
    ...(cached ? { initialData: [cached] as Types.MoveValue[] } : {}),
  });

  useEffect(() => {
    if (!data) return;
    const [val] = data as [FaMetadata];
    if (val) {
      setCachedFaMetadata(cacheKey, val);
    }
  }, [cacheKey, data]);

  if (cached) {
    return { isLoading: false, data: cached };
  }

  if (data) {
    const [val] = data as [FaMetadata];
    if (val !== undefined && val !== null) {
      return { isLoading, data: val };
    }
  }

  return { isLoading, data: null };
}

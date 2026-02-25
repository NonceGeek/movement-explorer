import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "../../store/useGlobalStore";
import { useGetAccountPackages } from "./useGetAccountPackages";

const PACKAGE_NAME_CACHE_LIMIT = 100;
const packageNameCache = new Map<string, string>();

function getCachedPackageName(key: string): string | null {
  const value = packageNameCache.get(key);
  if (!value) return null;
  // Refresh LRU order
  packageNameCache.delete(key);
  packageNameCache.set(key, value);
  return value;
}

function setCachedPackageName(key: string, value: string) {
  if (packageNameCache.has(key)) {
    packageNameCache.delete(key);
  }
  packageNameCache.set(key, value);
  if (packageNameCache.size > PACKAGE_NAME_CACHE_LIMIT) {
    const oldestKey = packageNameCache.keys().next().value as string | undefined;
    if (oldestKey) {
      packageNameCache.delete(oldestKey);
    }
  }
}

const PACKAGE_NAME_STALE_MS = 30 * 60 * 1000; // 30 minutes
const PACKAGE_NAME_GC_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Extract package address from event type string
 * Example: "0x123::module::Event" -> "0x123"
 */
export function extractPackageAddress(eventType: string): string | null {
  if (!eventType) return null;
  const parts = eventType.split("::");
  return parts[0] || null;
}

/**
 * Hook to get package name from package address
 * Uses LRU cache to avoid repeated queries
 */
export function useGetPackageName(packageAddress: string | null): {
  isLoading: boolean;
  data: string | null;
} {
  const { network_value } = useGlobalStore();
  const cacheKey = `${network_value}:${packageAddress}`;
  const cached = getCachedPackageName(cacheKey);

  const { packages, isLoading: isLoadingPackages } = useGetAccountPackages(
    packageAddress || ""
  );

  const { data, isLoading } = useQuery<string | null>({
    queryKey: ["packageName", cacheKey],
    queryFn: () => {
      if (!packages || packages.length === 0) {
        return null;
      }
      // Return the first package's name (usually only one package per address)
      return packages[0]?.name || null;
    },
    refetchOnWindowFocus: false,
    enabled: Boolean(packageAddress) && !cached && !isLoadingPackages,
    staleTime: PACKAGE_NAME_STALE_MS,
    gcTime: PACKAGE_NAME_GC_MS,
    ...(cached ? { initialData: cached } : {}),
  });

  useEffect(() => {
    if (!data) return;
    setCachedPackageName(cacheKey, data);
  }, [cacheKey, data]);

  if (cached) {
    return { isLoading: false, data: cached };
  }

  if (data) {
    return { isLoading, data };
  }

  return { isLoading: isLoading || isLoadingPackages, data: null };
}

import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import type { PackageMetadata } from "./useGetAccountPackages";

/**
 * Shared hook to fetch and cache the PackageRegistry for an address.
 * Used by useGetFunctionParams and useContractSourceAvailability
 * so they share a single cached request per address.
 */
export function useGetPackageRegistry(address: string | null) {
  const { aptos_client, network_name } = useGlobalStore();

  return useQuery<PackageMetadata[]>({
    queryKey: ["packageRegistry", address, network_name],
    queryFn: async () => {
      if (!address) throw new Error("No address");
      const resource = await aptos_client.getAccountResource(
        address,
        "0x1::code::PackageRegistry",
      );
      const registryData = resource.data as {
        packages?: PackageMetadata[];
      };
      return registryData?.packages ?? [];
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

import { useQuery } from "@tanstack/react-query";
import { getAccountResource } from "../../services/accounts";
import { useGlobalStore } from "../../store/useGlobalStore";
import { PackageMetadata } from "./useGetAccountPackages";

export function useContractSourceAvailability(address: string | null) {
  const { network_value, aptos_client } = useGlobalStore();

  const { data: hasSource = false, isLoading } = useQuery({
    queryKey: ["contractSourceAvailability", address, network_value],
    queryFn: async () => {
      if (!address) return false;
      const resource = await getAccountResource(
        { address, resourceType: "0x1::code::PackageRegistry" },
        aptos_client,
      );
      const registryData = resource.data as { packages?: PackageMetadata[] };
      const packages = registryData?.packages;
      if (!packages) return false;
      return packages.some((pkg) =>
        pkg.modules.some((mod) => mod.source && mod.source !== "0x"),
      );
    },
    enabled: !!address,
    staleTime: Infinity,
    retry: false,
  });

  return { hasSource, isLoading };
}

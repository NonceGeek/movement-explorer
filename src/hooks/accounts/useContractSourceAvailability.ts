import { useMemo } from "react";
import { useGetPackageRegistry } from "./useGetPackageRegistry";

/**
 * Check if any package under this address has source code available.
 * Shares the same cached PackageRegistry data as useGetFunctionParams.
 */
export function useContractSourceAvailability(address: string | null) {
  const { data: packages, isLoading } = useGetPackageRegistry(address);

  const hasSource = useMemo(() => {
    if (!packages) return false;
    return packages.some((pkg) =>
      pkg.modules.some((mod) => mod.source && mod.source !== "0x"),
    );
  }, [packages]);

  return { hasSource, isLoading };
}

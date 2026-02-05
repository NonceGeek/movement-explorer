import { useGetAccountResources } from "./useGetAccountResources";
import { orderBy } from "lodash";

export type ModuleMetadata = {
  name: string;
  source: string;
};

export type UpgradePolicy = {
  policy: number;
};

export type PackageMetadata = {
  name: string;
  modules: ModuleMetadata[];
  upgrade_policy: UpgradePolicy;
  upgrade_number: string;
  source_digest: string;
  manifest: string;
};

export function useGetAccountPackages(address: string) {
  const { data: resources, isLoading } = useGetAccountResources(address);

  const registry = resources?.find(
    (r) => r.type === "0x1::code::PackageRegistry",
  );

  const registryData = registry?.data as {
    packages?: PackageMetadata[];
  };

  const packages: PackageMetadata[] =
    registryData?.packages?.map((pkg): PackageMetadata => {
      const sortedModules = orderBy(pkg.modules, "name");
      return {
        name: pkg.name,
        modules: sortedModules,
        upgrade_policy: pkg.upgrade_policy,
        upgrade_number: pkg.upgrade_number,
        source_digest: pkg.source_digest,
        manifest: pkg.manifest,
      };
    }) || [];

  return { packages: orderBy(packages, "name"), isLoading };
}

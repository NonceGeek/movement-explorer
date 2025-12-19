import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getAccountResource } from "../../services";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
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

export function useGetAccountResource(
  address: string,
  resource: string
): UseQueryResult<Types.MoveResource, ResponseError> {
  const { network_value, aptos_client } = useGlobalStore();

  return useQuery<Types.MoveResource, ResponseError>({
    queryKey: ["accountResource", { address, resource }, network_value],
    queryFn: () =>
      getAccountResource({ address, resourceType: resource }, aptos_client),
    refetchOnWindowFocus: false,
  });
}

export function useGetAccountPackages(address: string) {
  const { data: registry } = useGetAccountResource(
    address,
    "0x1::code::PackageRegistry"
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

  return orderBy(packages, "name");
}

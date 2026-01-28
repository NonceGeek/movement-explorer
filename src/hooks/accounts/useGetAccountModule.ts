import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";

/**
 * Hook to fetch a single module with ABI
 */
export function useGetAccountModule(
  address: string,
  moduleName: string,
): UseQueryResult<Types.MoveModuleBytecode, Error> {
  const { aptos_client, network_name } = useGlobalStore();

  return useQuery<Types.MoveModuleBytecode, Error>({
    queryKey: ["accountModule", address, moduleName, network_name],
    queryFn: async () => {
      const module = await aptos_client.getAccountModule(address, moduleName);
      return module;
    },
    enabled: !!address && !!moduleName,
    refetchOnWindowFocus: false,
  });
}

import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";

/**
 * Hook to fetch all modules with ABI for an address
 */
export function useGetAccountModules(
  address: string,
): UseQueryResult<Types.MoveModuleBytecode[], Error> {
  const { aptos_client, network_name } = useGlobalStore();

  return useQuery<Types.MoveModuleBytecode[], Error>({
    queryKey: ["accountModules", address, network_name],
    queryFn: async () => {
      const modules = await aptos_client.getAccountModules(address);
      return modules;
    },
    enabled: !!address,
    refetchOnWindowFocus: false,
  });
}

import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";

export type GasPriceEstimate = {
  gas_estimate: number;
  deprioritized_gas_estimate: number;
  prioritized_gas_estimate: number;
};

export function useGetGasPrice() {
  const { network_value } = useGlobalStore();

  return useQuery<GasPriceEstimate>({
    queryKey: ["gasPrice", network_value],
    queryFn: async () => {
      const response = await fetch(`${network_value}/estimate_gas_price`);
      if (!response.ok) {
        throw new Error(`Failed to fetch gas price: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

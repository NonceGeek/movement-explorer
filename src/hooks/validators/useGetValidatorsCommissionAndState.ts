import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import {
  getValidatorCommissionAndState,
  getValidatorCommission,
  getValidatorState,
} from "@/services/staking";
import { useGlobalStore } from "@/store/useGlobalStore";

export interface ValidatorCommissionAndState {
  commission: number; // percentage, e.g. 22.85 for 22.85%
  status: number; // 1=Pending Active, 2=Active, 3=Pending Inactive, 4=Inactive
}

/**
 * Fetch commission + state for each validator individually.
 * Fallback when the batch helper contract is not deployed.
 */
async function fetchIndividually(
  client: import("aptos").AptosClient,
  addresses: string[],
): Promise<Map<string, ValidatorCommissionAndState>> {
  const map = new Map<string, ValidatorCommissionAndState>();
  const results = await Promise.allSettled(
    addresses.map(async (addr) => {
      const [commissionRes, stateRes] = await Promise.all([
        getValidatorCommission(client, addr),
        getValidatorState(client, addr),
      ]);
      return {
        addr,
        commission: Number(commissionRes[0]) / 100, // 2285 -> 22.85
        status: Number(stateRes[0]),
      };
    }),
  );
  for (const result of results) {
    if (result.status === "fulfilled") {
      map.set(result.value.addr, {
        commission: result.value.commission,
        status: result.value.status,
      });
    }
  }
  return map;
}

export function useGetValidatorsCommissionAndState(
  validatorAddresses: string[],
) {
  const { aptos_client, network_value } = useGlobalStore();

  return useQuery<Map<string, ValidatorCommissionAndState>, Error>({
    queryKey: [
      "validatorsCommissionAndState",
      network_value,
      ...validatorAddresses,
    ],
    queryFn: async () => {
      // Try batch query first (requires helper contract deployment)
      try {
        const res = await getValidatorCommissionAndState(
          aptos_client,
          validatorAddresses,
        );
        const ret = res[0] as [Types.MoveValue, Types.MoveValue][];
        const map = new Map<string, ValidatorCommissionAndState>();
        validatorAddresses.forEach((addr, i) => {
          if (ret[i]) {
            map.set(addr, {
              commission: Number(ret[i][0]) / 100,
              status: Number(ret[i][1]),
            });
          }
        });
        return map;
      } catch {
        // Batch contract not available, fall back to individual queries
        console.warn(
          "Batch helper contract not available, falling back to individual queries",
        );
        return fetchIndividually(aptos_client, validatorAddresses);
      }
    },
    enabled: validatorAddresses.length > 0,
  });
}

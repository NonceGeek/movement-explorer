import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";
import { standardizeAddress } from "@/utils";

const MOVE_COIN_TYPE = "0x1::aptos_coin::AptosCoin";

export interface AccountMoveFlow {
  totalInflow: bigint; // octas
  totalOutflow: bigint; // octas
  netFlow: bigint; // octas (inflow - outflow)
}

/**
 * Get MOVE token inflow/outflow aggregates for an account.
 * Uses coin_activities_aggregate to compute server-side sums
 * of deposit and withdraw events.
 */
export function useGetAccountMoveFlow(
  address: string,
): UseQueryResult<AccountMoveFlow | null, ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  return useQuery<AccountMoveFlow | null, ResponseError>({
    queryKey: ["accountMoveFlow", address, network_value],
    queryFn: async () => {
      try {
        const result = await sdk_v2_client.queryIndexer<{
          inflow: { aggregate: { sum: { amount: number | null } } };
          outflow: { aggregate: { sum: { amount: number | null } } };
          gas: { aggregate: { sum: { amount: number | null } } };
        }>({
          query: {
            query: `
              query AccountMoveFlow($address: String!, $coinType: String!) {
                inflow: coin_activities_aggregate(
                  where: {
                    owner_address: { _eq: $address }
                    activity_type: { _eq: "0x1::coin::DepositEvent" }
                    coin_type: { _eq: $coinType }
                    is_gas_fee: { _eq: false }
                  }
                ) {
                  aggregate {
                    sum {
                      amount
                    }
                  }
                }
                outflow: coin_activities_aggregate(
                  where: {
                    owner_address: { _eq: $address }
                    activity_type: { _eq: "0x1::coin::WithdrawEvent" }
                    coin_type: { _eq: $coinType }
                    is_gas_fee: { _eq: false }
                  }
                ) {
                  aggregate {
                    sum {
                      amount
                    }
                  }
                }
                gas: coin_activities_aggregate(
                  where: {
                    owner_address: { _eq: $address }
                    coin_type: { _eq: $coinType }
                    is_gas_fee: { _eq: true }
                  }
                ) {
                  aggregate {
                    sum {
                      amount
                    }
                  }
                }
              }
            `,
            variables: {
              address: addr64Hash,
              coinType: MOVE_COIN_TYPE,
            },
          },
        });

        const inflowRaw = result.inflow?.aggregate?.sum?.amount ?? 0;
        const outflowRaw = result.outflow?.aggregate?.sum?.amount ?? 0;
        const gasRaw = result.gas?.aggregate?.sum?.amount ?? 0;

        const totalInflow = BigInt(Math.round(inflowRaw));
        // Outflow includes withdrawals + gas fees
        const totalOutflow = BigInt(Math.round(outflowRaw)) + BigInt(Math.round(gasRaw));
        const netFlow = totalInflow - totalOutflow;

        return {
          totalInflow,
          totalOutflow,
          netFlow,
        };
      } catch (e) {
        console.error("Failed to fetch account MOVE flow:", e);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes - flow data changes slowly
  });
}

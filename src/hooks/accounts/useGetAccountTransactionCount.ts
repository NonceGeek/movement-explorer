import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { standardizeAddress } from "../../utils";

export function useGetAccountTransactionCount(
  address: string,
): UseQueryResult<number | undefined, ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  return useQuery<number | undefined, ResponseError>({
    queryKey: ["accountTransactionCount", addr64Hash, network_value],
    queryFn: async () => {
      try {
        const result = await sdk_v2_client.queryIndexer<{
          account_transactions_aggregate: { aggregate: { count: number } };
        }>({
          query: {
            query: `
              query AccountTransactionsCount($address: String!) {
                account_transactions_aggregate(
                  where: { account_address: { _eq: $address } }
                ) {
                  aggregate {
                    count
                  }
                }
              }
            `,
            variables: { address: addr64Hash },
          },
        });

        return result.account_transactions_aggregate?.aggregate?.count;
      } catch (e) {
        // Fallback or error handling if indexer is not available
        console.error("Indexer count fetch failed:", e);
        return undefined;
      }
    },
    enabled: !!address,
  });
}

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { standardizeAddress } from "../../utils";

export function useGetAccountTransactionCount(
  address: string
): UseQueryResult<number | undefined, ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  return useQuery<number | undefined, ResponseError>({
    queryKey: ["accountTransactionCount", address, network_value],
    queryFn: async () => {
      try {
        // Match source project: use move_resources_aggregate for count
        const result = await sdk_v2_client.queryIndexer<{
          move_resources_aggregate: { aggregate: { count: number } };
        }>({
          query: {
            query: `
              query AccountTransactionsCount($address: String) {
                move_resources_aggregate(
                  where: {address: {_eq: $address}}
                  distinct_on: transaction_version
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
        
        console.log("Transaction count result:", result);
        
        return result.move_resources_aggregate?.aggregate?.count;
      } catch (e) {
        // Fallback or error handling if indexer is not available
        console.error("Indexer count fetch failed:", e);
        return undefined;
      }
    },
    enabled: !!address,
  });
}


import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { standardizeAddress } from "../../utils";

/**
 * Get transaction versions for an account from the indexer.
 * This follows the source project pattern: fetch only version numbers,
 * then each row fetches full details individually.
 */
export function useGetAccountTransactionVersions(
  address: string,
  limit: number,
  offset: number
): UseQueryResult<number[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  return useQuery<number[], ResponseError>({
    queryKey: ["accountTransactionVersions", address, limit, offset, network_value],
    queryFn: async () => {
      try {
        const result = await sdk_v2_client.queryIndexer<{
          account_transactions: Array<{ transaction_version: number }>;
        }>({
          query: {
            query: `
              query AccountTransactionsData($address: String, $limit: Int, $offset: Int) {
                account_transactions(
                  where: {account_address: {_eq: $address}}
                  order_by: {transaction_version: desc}
                  limit: $limit
                  offset: $offset
                ) {
                  transaction_version
                }
              }
            `,
            variables: { address: addr64Hash, limit, offset },
          },
        });

        console.log("Transaction versions result:", result);

        return (result.account_transactions || []).map(
          (record) => record.transaction_version
        );
      } catch (e) {
        console.error("Indexer fetch failed:", e);
        return [];
      }
    },
    enabled: !!address && limit > 0,
  });
}

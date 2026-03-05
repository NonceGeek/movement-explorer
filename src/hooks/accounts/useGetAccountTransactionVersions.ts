import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { standardizeAddress } from "../../utils";

const QUERY_WITHOUT_TIMESTAMP = `
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
`;

const QUERY_WITH_TIMESTAMP = `
  query AccountTransactionsDataWithTimestamp($address: String, $limit: Int, $offset: Int, $timestampGte: timestamp, $timestampLte: timestamp) {
    account_transactions(
      where: {
        account_address: {_eq: $address}
        user_transaction: {
          timestamp: {_gte: $timestampGte, _lte: $timestampLte}
        }
      }
      order_by: {transaction_version: desc}
      limit: $limit
      offset: $offset
    ) {
      transaction_version
    }
  }
`;

/**
 * Get transaction versions for an account from the indexer.
 * This follows the source project pattern: fetch only version numbers,
 * then each row fetches full details individually.
 *
 * Optionally filters by timestamp range via the user_transaction relationship.
 */
export function useGetAccountTransactionVersions(
  address: string,
  limit: number,
  offset: number,
  timestampGte?: string | null,
  timestampLte?: string | null,
): UseQueryResult<number[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  const hasTimestamp = !!timestampGte && !!timestampLte;

  return useQuery<number[], ResponseError>({
    queryKey: [
      "accountTransactionVersions",
      address,
      limit,
      offset,
      timestampGte ?? null,
      timestampLte ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const query = hasTimestamp
          ? QUERY_WITH_TIMESTAMP
          : QUERY_WITHOUT_TIMESTAMP;

        const variables: Record<string, unknown> = {
          address: addr64Hash,
          limit,
          offset,
        };
        if (hasTimestamp) {
          variables.timestampGte = timestampGte;
          variables.timestampLte = timestampLte;
        }

        const result = await sdk_v2_client.queryIndexer<{
          account_transactions: Array<{ transaction_version: number }>;
        }>({
          query: {
            query,
            variables,
          },
        });

        console.log("Transaction versions result:", result);

        return (result.account_transactions || []).map(
          (record) => record.transaction_version,
        );
      } catch (e) {
        console.error("Indexer fetch failed:", e);
        return [];
      }
    },
    enabled: !!address && limit > 0,
  });
}

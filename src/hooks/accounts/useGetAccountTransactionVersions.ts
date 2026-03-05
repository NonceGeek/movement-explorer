import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { standardizeAddress } from "../../utils";

/**
 * Build the GraphQL query and variables for account transaction versions.
 * Handles optional timestamp and sender filters.
 */
function buildTransactionVersionsQuery(
  address: string,
  limit: number,
  offset: number,
  timestampGte?: string | null,
  timestampLte?: string | null,
  sender?: string | null,
): { query: string; variables: Record<string, unknown> } {
  const hasTimestamp = !!timestampGte && !!timestampLte;
  const hasSender = !!sender;

  // Build variable declarations
  const varParts = ["$address: String", "$limit: Int", "$offset: Int"];
  if (hasTimestamp) {
    varParts.push("$timestampGte: timestamp", "$timestampLte: timestamp");
  }
  if (hasSender) {
    varParts.push("$sender: String!");
  }

  // Build where clause parts
  const whereParts = ["account_address: { _eq: $address }"];
  // Build user_transaction sub-filter
  const utParts: string[] = [];
  if (hasTimestamp) {
    utParts.push("timestamp: { _gte: $timestampGte, _lte: $timestampLte }");
  }
  if (hasSender) {
    utParts.push("sender: { _eq: $sender }");
  }
  if (utParts.length > 0) {
    whereParts.push(`user_transaction: { ${utParts.join(", ")} }`);
  }

  const query = `
    query AccountTransactionsData(${varParts.join(", ")}) {
      account_transactions(
        where: { ${whereParts.join(", ")} }
        order_by: { transaction_version: desc }
        limit: $limit
        offset: $offset
      ) {
        transaction_version
      }
    }
  `;

  const variables: Record<string, unknown> = { address, limit, offset };
  if (hasTimestamp) {
    variables.timestampGte = timestampGte;
    variables.timestampLte = timestampLte;
  }
  if (hasSender) {
    variables.sender = sender;
  }

  return { query, variables };
}

/**
 * Get transaction versions for an account from the indexer.
 * This follows the source project pattern: fetch only version numbers,
 * then each row fetches full details individually.
 *
 * Optionally filters by timestamp range and/or sender address.
 */
export function useGetAccountTransactionVersions(
  address: string,
  limit: number,
  offset: number,
  timestampGte?: string | null,
  timestampLte?: string | null,
  sender?: string | null,
): UseQueryResult<number[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  return useQuery<number[], ResponseError>({
    queryKey: [
      "accountTransactionVersions",
      address,
      limit,
      offset,
      timestampGte ?? null,
      timestampLte ?? null,
      sender ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const { query, variables } = buildTransactionVersionsQuery(
          addr64Hash,
          limit,
          offset,
          timestampGte,
          timestampLte,
          sender,
        );

        const result = await sdk_v2_client.queryIndexer<{
          account_transactions: Array<{ transaction_version: number }>;
        }>({
          query: {
            query,
            variables,
          },
        });

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

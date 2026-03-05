import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";

/**
 * Build the GraphQL query and variables for coin transfer versions.
 * Handles all 4 combinations: with/without assetType x with/without timestamp.
 */
function buildCoinTransfersQuery(
  address: string,
  limit: number,
  offset: number,
  assetType?: string | null,
  timestampGte?: string | null,
  timestampLte?: string | null,
  sender?: string | null,
): { query: string; variables: Record<string, unknown> } {
  const hasAsset = !!assetType;
  const hasTimestamp = !!timestampGte && !!timestampLte;
  const hasSender = !!sender;

  // Build variable declarations
  const varParts = ["$address: String!", "$limit: Int", "$offset: Int"];
  if (hasAsset) varParts.push("$assetType: String!");
  if (hasTimestamp) {
    varParts.push("$timestampGte: timestamp");
    varParts.push("$timestampLte: timestamp");
  }
  if (hasSender) varParts.push("$sender: String!");

  // Build where clause parts
  const whereParts = ["account_address: { _eq: $address }"];
  const faaFilter = hasAsset
    ? "fungible_asset_activities: { is_gas_fee: { _eq: false }, asset_type: { _eq: $assetType } }"
    : "fungible_asset_activities: { is_gas_fee: { _eq: false } }";
  whereParts.push(faaFilter);

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
    query AccountCoinTransferVersions(${varParts.join(", ")}) {
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
  if (hasAsset) variables.assetType = assetType;
  if (hasTimestamp) {
    variables.timestampGte = timestampGte;
    variables.timestampLte = timestampLte;
  }
  if (hasSender) variables.sender = sender;

  return { query, variables };
}

/**
 * Get transaction versions for coin transfer activities from the indexer.
 * Same pattern as useGetAccountTransactionVersions, but filtered to
 * transactions that have fungible_asset_activities (excluding gas fees).
 *
 * Optionally filters by assetType and/or timestamp range.
 */
export function useGetAccountCoinTransfers(
  address: string,
  limit: number = 25,
  offset: number = 0,
  assetType?: string | null,
  timestampGte?: string | null,
  timestampLte?: string | null,
  sender?: string | null,
): UseQueryResult<number[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();

  return useQuery<number[], ResponseError>({
    queryKey: [
      "accountCoinTransferVersions",
      address,
      limit,
      offset,
      assetType ?? null,
      timestampGte ?? null,
      timestampLte ?? null,
      sender ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const { query, variables } = buildCoinTransfersQuery(
          address,
          limit,
          offset,
          assetType,
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
        console.error("Coin transfer versions fetch failed:", e);
        return [];
      }
    },
    enabled: !!address && limit > 0,
  });
}

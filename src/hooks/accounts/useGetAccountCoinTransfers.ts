import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";
import { tryStandardizeAddress } from "@/utils";

const MOVE_ASSET_TYPES = [
  "0x1::aptos_coin::AptosCoin",
  "0xa",
  "0x000000000000000000000000000000000000000000000000000000000000000a",
];

function expandAssetTypeFilter(assetType?: string | null) {
  if (!assetType) return [];

  const normalizedAssetAddress = assetType.includes("::")
    ? null
    : tryStandardizeAddress(assetType);
  const isMoveAsset =
    MOVE_ASSET_TYPES.includes(assetType) ||
    (!!normalizedAssetAddress &&
      MOVE_ASSET_TYPES.includes(normalizedAssetAddress));
  const candidates = isMoveAsset
    ? [...MOVE_ASSET_TYPES, assetType, normalizedAssetAddress]
    : [assetType, normalizedAssetAddress];

  return Array.from(
    new Set(candidates.filter((candidate): candidate is string => !!candidate)),
  );
}

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
  const assetTypes = expandAssetTypeFilter(assetType);
  const hasAsset = assetTypes.length > 0;
  const hasTimestamp = !!timestampGte && !!timestampLte;
  const hasSender = !!sender;

  // Build variable declarations
  const varParts = ["$address: String!", "$limit: Int", "$offset: Int"];
  if (hasAsset) varParts.push("$assetTypes: [String!]");
  if (hasTimestamp) {
    varParts.push("$timestampGte: timestamp");
    varParts.push("$timestampLte: timestamp");
  }
  if (hasSender) varParts.push("$sender: String!");

  // Build where clause parts
  const whereParts = ["account_address: { _eq: $address }"];
  const faaFilter = hasAsset
    ? "fungible_asset_activities: { is_gas_fee: { _eq: false }, asset_type: { _in: $assetTypes } }"
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
  if (hasAsset) variables.assetTypes = assetTypes;
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
  const normalizedAddress = tryStandardizeAddress(address);
  const normalizedSender = sender ? tryStandardizeAddress(sender) : null;

  return useQuery<number[], ResponseError>({
    queryKey: [
      "accountCoinTransferVersions",
      normalizedAddress ?? address,
      limit,
      offset,
      assetType ?? null,
      timestampGte ?? null,
      timestampLte ?? null,
      normalizedSender ?? sender ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        if (!normalizedAddress) return [];

        const { query, variables } = buildCoinTransfersQuery(
          normalizedAddress,
          limit,
          offset,
          assetType,
          timestampGte,
          timestampLte,
          normalizedSender,
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
    enabled: !!normalizedAddress && limit > 0,
  });
}

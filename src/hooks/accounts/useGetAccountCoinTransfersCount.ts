import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { tryStandardizeAddress } from "../../utils";

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
 * Build the GraphQL query and variables for coin transfer count.
 * Handles all 4 combinations: with/without assetType x with/without timestamp.
 */
function buildCoinTransfersCountQuery(
  address: string,
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
  const varParts = ["$address: String!"];
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
    query GetAccountCoinTransfersCount(${varParts.join(", ")}) {
      account_transactions_aggregate(
        where: { ${whereParts.join(", ")} }
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  const variables: Record<string, unknown> = { address };
  if (hasAsset) variables.assetTypes = assetTypes;
  if (hasTimestamp) {
    variables.timestampGte = timestampGte;
    variables.timestampLte = timestampLte;
  }
  if (hasSender) variables.sender = sender;

  return { query, variables };
}

export function useGetAccountCoinTransfersCount(
  address: string,
  assetType?: string | null,
  timestampGte?: string | null,
  timestampLte?: string | null,
  sender?: string | null,
): {
  isLoading: boolean;
  error: ResponseError | undefined;
  data: number | undefined;
} {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const normalizedAddress = tryStandardizeAddress(address);
  const normalizedSender = sender ? tryStandardizeAddress(sender) : null;

  const { isLoading, error, data } = useQuery<
    number | undefined,
    ResponseError
  >({
    queryKey: [
      "accountCoinTransfersCount",
      normalizedAddress ?? address,
      assetType ?? null,
      timestampGte ?? null,
      timestampLte ?? null,
      normalizedSender ?? sender ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        if (!normalizedAddress) return undefined;

        const { query, variables } = buildCoinTransfersCountQuery(
          normalizedAddress,
          assetType,
          timestampGte,
          timestampLte,
          normalizedSender,
        );

        const result = await sdk_v2_client.queryIndexer<{
          account_transactions_aggregate: {
            aggregate: { count: number };
          };
        }>({
          query: {
            query,
            variables,
          },
        });

        return result.account_transactions_aggregate?.aggregate?.count;
      } catch (e) {
        console.error("Coin transfers count fetch failed:", e);
        return undefined;
      }
    },
    enabled: !!normalizedAddress,
  });

  return {
    isLoading,
    error: error ?? undefined,
    data,
  };
}

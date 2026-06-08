import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { tryStandardizeAddress } from "../../utils";

/**
 * Build the GraphQL query and variables for coin transfer count.
 * Handles all 4 combinations: with/without assetType x with/without timestamp.
 */
function buildCoinTransfersCountQuery(
  address: string,
  assetType?: string | null,
  timestampGte?: string | null,
  timestampLte?: string | null,
): { query: string; variables: Record<string, unknown> } {
  const hasAsset = !!assetType;
  const hasTimestamp = !!timestampGte && !!timestampLte;

  // Build variable declarations
  const varParts = ["$address: String!"];
  if (hasAsset) varParts.push("$assetType: String!");
  if (hasTimestamp) {
    varParts.push("$timestampGte: timestamp");
    varParts.push("$timestampLte: timestamp");
  }

  // Build where clause parts
  const whereParts = ["account_address: { _eq: $address }"];
  const faaFilter = hasAsset
    ? "fungible_asset_activities: { is_gas_fee: { _eq: false }, asset_type: { _eq: $assetType } }"
    : "fungible_asset_activities: { is_gas_fee: { _eq: false } }";
  whereParts.push(faaFilter);
  if (hasTimestamp) {
    whereParts.push(
      "user_transaction: { timestamp: { _gte: $timestampGte, _lte: $timestampLte } }",
    );
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
  if (hasAsset) variables.assetType = assetType;
  if (hasTimestamp) {
    variables.timestampGte = timestampGte;
    variables.timestampLte = timestampLte;
  }

  return { query, variables };
}

export function useGetAccountCoinTransfersCount(
  address: string,
  assetType?: string | null,
  timestampGte?: string | null,
  timestampLte?: string | null,
): {
  isLoading: boolean;
  error: ResponseError | undefined;
  data: number | undefined;
} {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const normalizedAddress = tryStandardizeAddress(address);

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

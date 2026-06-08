import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";

export type AccountFungibleAssetActivity = {
  amount: number;
  asset_type: string;
  event_index: number;
  entry_function_id_str: string;
  owner_address: string;
  transaction_timestamp: string;
  transaction_version: number;
  type: string;
  metadata?: {
    asset_type: string;
    decimals: number;
    name?: string;
    symbol: string;
  };
};

const ACTIVITIES_BY_VERSIONS_QUERY = `
  query FungibleAssetActivitiesByVersions($versions: [bigint!]) {
    fungible_asset_activities(
      where: {
        transaction_version: { _in: $versions },
        is_gas_fee: { _eq: false }
      }
      order_by: [
        { transaction_version: desc },
        { event_index: asc }
      ]
    ) {
      amount
      asset_type
      event_index
      entry_function_id_str
      owner_address
      transaction_timestamp
      transaction_version
      type
      metadata {
        asset_type
        decimals
        name
        symbol
      }
    }
  }
`;

export function useGetFungibleAssetActivitiesByVersions(
  versions: number[],
): UseQueryResult<AccountFungibleAssetActivity[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const uniqueVersions = Array.from(new Set(versions)).sort((a, b) => b - a);

  return useQuery<AccountFungibleAssetActivity[], ResponseError>({
    queryKey: [
      "fungibleAssetActivitiesByVersions",
      uniqueVersions.join(","),
      network_value,
    ],
    queryFn: async () => {
      if (uniqueVersions.length === 0) return [];

      try {
        const result = await sdk_v2_client.queryIndexer<{
          fungible_asset_activities: AccountFungibleAssetActivity[];
        }>({
          query: {
            query: ACTIVITIES_BY_VERSIONS_QUERY,
            variables: {
              versions: uniqueVersions,
            },
          },
        });

        return result.fungible_asset_activities || [];
      } catch (e) {
        console.error("Fungible asset activities by versions failed:", e);
        return [];
      }
    },
    enabled: uniqueVersions.length > 0,
  });
}

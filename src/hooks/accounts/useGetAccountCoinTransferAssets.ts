import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";
import { tryStandardizeAddress } from "@/utils";

export type AccountCoinTransferAsset = {
  asset_type: string;
  metadata?: {
    asset_type: string;
    decimals: number;
    name?: string;
    symbol: string;
  };
};

const ACCOUNT_COIN_TRANSFER_ASSETS_QUERY = `
  query AccountCoinTransferAssets($address: String!) {
    fungible_asset_activities(
      where: {
        owner_address: { _eq: $address },
        is_gas_fee: { _eq: false }
      }
      distinct_on: asset_type
      order_by: { asset_type: asc }
    ) {
      asset_type
      metadata {
        asset_type
        decimals
        name
        symbol
      }
    }
  }
`;

export function useGetAccountCoinTransferAssets(
  address: string,
): UseQueryResult<AccountCoinTransferAsset[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const normalizedAddress = tryStandardizeAddress(address);

  return useQuery<AccountCoinTransferAsset[], ResponseError>({
    queryKey: [
      "accountCoinTransferAssets",
      normalizedAddress ?? address,
      network_value,
    ],
    queryFn: async () => {
      try {
        if (!normalizedAddress) return [];

        const result = await sdk_v2_client.queryIndexer<{
          fungible_asset_activities: AccountCoinTransferAsset[];
        }>({
          query: {
            query: ACCOUNT_COIN_TRANSFER_ASSETS_QUERY,
            variables: {
              address: normalizedAddress,
            },
          },
        });

        return result.fungible_asset_activities || [];
      } catch (e) {
        console.error("Account coin transfer assets fetch failed:", e);
        return [];
      }
    },
    enabled: !!normalizedAddress,
  });
}

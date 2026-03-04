import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetAccountCoinTransfersCount(
  address: string,
  assetType?: string | null,
): {
  isLoading: boolean;
  error: ResponseError | undefined;
  data: number | undefined;
} {
  const { network_value, sdk_v2_client } = useGlobalStore();

  const { isLoading, error, data } = useQuery<
    number | undefined,
    ResponseError
  >({
    queryKey: [
      "accountCoinTransfersCount",
      address,
      assetType ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const query = assetType
          ? `
            query GetAccountCoinTransfersCountByAsset($address: String!, $assetType: String!) {
              account_transactions_aggregate(
                where: {
                  account_address: { _eq: $address }
                  fungible_asset_activities: {
                    is_gas_fee: { _eq: false }
                    asset_type: { _eq: $assetType }
                  }
                }
              ) {
                aggregate {
                  count
                }
              }
            }
          `
          : `
            query GetAccountCoinTransfersCount($address: String!) {
              account_transactions_aggregate(
                where: {
                  account_address: { _eq: $address }
                  fungible_asset_activities: { is_gas_fee: { _eq: false } }
                }
              ) {
                aggregate {
                  count
                }
              }
            }
          `;

        const variables: Record<string, unknown> = { address };
        if (assetType) {
          variables.assetType = assetType;
        }

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
    enabled: !!address,
  });

  return {
    isLoading,
    error: error ?? undefined,
    data,
  };
}

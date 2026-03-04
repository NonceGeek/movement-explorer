import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";

/**
 * Get transaction versions for coin transfer activities from the indexer.
 * Same pattern as useGetAccountTransactionVersions, but filtered to
 * transactions that have fungible_asset_activities (excluding gas fees).
 */
export function useGetAccountCoinTransfers(
  address: string,
  limit: number = 25,
  offset: number = 0,
  assetType?: string | null,
): UseQueryResult<number[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();

  return useQuery<number[], ResponseError>({
    queryKey: [
      "accountCoinTransferVersions",
      address,
      limit,
      offset,
      assetType ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const query = assetType
          ? `
            query AccountCoinTransferVersionsByAsset($address: String!, $limit: Int, $offset: Int, $assetType: String!) {
              account_transactions(
                where: {
                  account_address: { _eq: $address }
                  fungible_asset_activities: {
                    is_gas_fee: { _eq: false }
                    asset_type: { _eq: $assetType }
                  }
                }
                order_by: { transaction_version: desc }
                limit: $limit
                offset: $offset
              ) {
                transaction_version
              }
            }
          `
          : `
            query AccountCoinTransferVersions($address: String!, $limit: Int, $offset: Int) {
              account_transactions(
                where: {
                  account_address: { _eq: $address }
                  fungible_asset_activities: { is_gas_fee: { _eq: false } }
                }
                order_by: { transaction_version: desc }
                limit: $limit
                offset: $offset
              ) {
                transaction_version
              }
            }
          `;

        const variables: Record<string, unknown> = { address, limit, offset };
        if (assetType) {
          variables.assetType = assetType;
        }

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

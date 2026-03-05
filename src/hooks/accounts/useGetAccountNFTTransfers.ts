import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";

export interface NFTActivity {
  transaction_version: number;
  event_index: number;
  type: string;
  from_address: string | null;
  to_address: string | null;
  token_data_id: string;
  token_amount: number;
  token_standard: string;
  transaction_timestamp: string;
  entry_function_id_str: string | null;
}

/**
 * Get NFT transfer activities from `token_activities_v2` Indexer table.
 * Queries by from_address OR to_address matching the account.
 * Optionally filters by activity type (e.g. MintEvent, TransferEvent, BurnEvent).
 */
export function useGetAccountNFTTransfers(
  address: string,
  limit: number = 25,
  offset: number = 0,
  activityType?: string | null,
): UseQueryResult<NFTActivity[], ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();

  return useQuery<NFTActivity[], ResponseError>({
    queryKey: [
      "accountNFTTransfers",
      address,
      limit,
      offset,
      activityType ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const query = activityType
          ? `
            query AccountNFTTransfersByType($address: String!, $limit: Int, $offset: Int, $activityType: String!) {
              token_activities_v2(
                where: {
                  _or: [
                    { from_address: { _eq: $address } }
                    { to_address: { _eq: $address } }
                  ]
                  type: { _eq: $activityType }
                }
                order_by: { transaction_version: desc }
                limit: $limit
                offset: $offset
              ) {
                transaction_version
                event_index
                type
                from_address
                to_address
                token_data_id
                token_amount
                token_standard
                transaction_timestamp
                entry_function_id_str
              }
            }
          `
          : `
            query AccountNFTTransfers($address: String!, $limit: Int, $offset: Int) {
              token_activities_v2(
                where: {
                  _or: [
                    { from_address: { _eq: $address } }
                    { to_address: { _eq: $address } }
                  ]
                }
                order_by: { transaction_version: desc }
                limit: $limit
                offset: $offset
              ) {
                transaction_version
                event_index
                type
                from_address
                to_address
                token_data_id
                token_amount
                token_standard
                transaction_timestamp
                entry_function_id_str
              }
            }
          `;

        const variables: Record<string, unknown> = { address, limit, offset };
        if (activityType) {
          variables.activityType = activityType;
        }

        const result = await sdk_v2_client.queryIndexer<{
          token_activities_v2: NFTActivity[];
        }>({
          query: { query, variables },
        });

        return result.token_activities_v2 || [];
      } catch (e) {
        console.error("NFT transfers fetch failed:", e);
        return [];
      }
    },
    enabled: !!address && limit > 0,
  });
}

import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

export type FAActivity = {
  transaction_version: number;
  transaction_timestamp: string;
  owner_address: string;
};

export function useGetCoinActivities(
  asset: string,
  offset: number = 0,
  limit: number = 25
): {
  isLoading: boolean;
  error: Error | undefined;
  data: FAActivity[] | undefined;
} {
  const { loading, error, data } = useGraphqlQuery<{
    fungible_asset_activities: FAActivity[];
  }>(
    // Exclude gas fees from the list
    gql`
      query GetFungibleAssetActivities($asset: String, $offset: Int, $limit: Int) {
        fungible_asset_activities(
          where: {
            asset_type: { _eq: $asset }
            type: { _neq: "0x1::aptos_coin::GasFeeEvent" }
          }
          offset: $offset
          limit: $limit
          order_by: { transaction_version: desc }
          distinct_on: transaction_version
        ) {
          transaction_version
          owner_address
          transaction_timestamp
        }
      }
    `,
    { variables: { asset, offset, limit } }
  );

  return {
    isLoading: loading,
    error,
    data: data?.fungible_asset_activities,
  };
}

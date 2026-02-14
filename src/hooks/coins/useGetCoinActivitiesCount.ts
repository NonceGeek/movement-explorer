import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

export function useGetCoinActivitiesCount(asset: string): {
  isLoading: boolean;
  error: Error | undefined;
  data: number | undefined;
} {
  const { loading, error, data } = useGraphqlQuery<{
    coin_activities_aggregate: {
      aggregate: { count: number };
    };
  }>(
    gql`
      query GetCoinActivitiesCount($asset: String) {
        coin_activities_aggregate(
          where: {
            coin_type: { _eq: $asset }
            is_gas_fee: { _eq: false }
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `,
    { variables: { asset } },
  );

  return {
    isLoading: loading,
    error,
    data: data?.coin_activities_aggregate?.aggregate?.count,
  };
}

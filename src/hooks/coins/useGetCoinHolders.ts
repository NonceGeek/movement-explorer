import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

export type CoinHolder = {
  owner_address: string;
  amount_v2: number | null;
};

export function useGetCoinHolders(
  coin_type: string,
  offset?: number
): {
  isLoading: boolean;
  error: Error | undefined;
  data: CoinHolder[] | undefined;
} {
  const { loading, error, data } = useGraphqlQuery<{
    current_fungible_asset_balances: CoinHolder[];
  }>(
    gql`
      query GetFungibleAssetBalances($coin_type: String!, $offset: Int!) {
        current_fungible_asset_balances(
          where: { asset_type: { _eq: $coin_type } }
          limit: 100
          offset: $offset
          order_by: { amount_v2: desc }
        ) {
          owner_address
          amount_v2
        }
      }
    `,
    { variables: { coin_type, offset: offset ?? 0 } }
  );

  return {
    isLoading: loading,
    error,
    data: data?.current_fungible_asset_balances,
  };
}

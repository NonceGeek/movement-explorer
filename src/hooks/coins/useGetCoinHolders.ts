import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

type RawCoinHolder = {
  owner_address: string;
  amount: string | null;
};

export type CoinHolder = {
  owner_address: string;
  amount: string | null;
};

export function useGetCoinHolders(
  coin_type: string,
  offset?: number,
): {
  isLoading: boolean;
  error: Error | undefined;
  data: CoinHolder[] | undefined;
} {
  const { loading, error, data } = useGraphqlQuery<{
    current_fungible_asset_balances: RawCoinHolder[];
  }>(
    gql`
      query GetFungibleAssetBalances($coin_type: String!, $offset: Int!) {
        current_fungible_asset_balances(
          where: {
            asset_type: { _eq: $coin_type }
            amount: { _is_null: false }
          }
          limit: 100
          offset: $offset
          order_by: { amount: desc_nulls_last }
        ) {
          owner_address
          amount
        }
      }
    `,
    { variables: { coin_type, offset: offset ?? 0 } },
  );

  return {
    isLoading: loading,
    error,
    data: data?.current_fungible_asset_balances?.filter(
      (holder) => holder.amount !== null && holder.amount !== undefined,
    ),
  };
}

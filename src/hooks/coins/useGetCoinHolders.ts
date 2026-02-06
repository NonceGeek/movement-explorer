import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

type RawCoinHolder = {
  owner_address: string;
  amount: string;
};

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
    current_fungible_asset_balances: RawCoinHolder[];
  }>(
    gql`
      query GetFungibleAssetBalances($coin_type: String!, $offset: Int!) {
        current_fungible_asset_balances(
          where: { asset_type: { _eq: $coin_type }, amount: { _gt: "0" } }
          limit: 100
          offset: $offset
          order_by: { amount: desc }
        ) {
          owner_address
          amount
        }
      }
    `,
    { variables: { coin_type, offset: offset ?? 0 } }
  );

  // Transform amount to amount_v2 for backward compatibility
  const holders = data?.current_fungible_asset_balances?.map((holder) => ({
    owner_address: holder.owner_address,
    amount_v2: holder.amount ? parseInt(holder.amount, 10) : null,
  }));

  return {
    isLoading: loading,
    error,
    data: holders,
  };
}

import { gql } from "@apollo/client";
import { useQuery as useGraphqlQuery } from "@apollo/client/react";

const TRANSACTION_BALANCE_CHANGES_QUERY = gql`
  query TransactionQuery($txn_version: bigint) {
    fungible_asset_activities(
      where: { transaction_version: { _eq: $txn_version } }
    ) {
      amount
      entry_function_id_str
      gas_fee_payer_address
      is_frozen
      asset_type
      event_index
      owner_address
      transaction_timestamp
      transaction_version
      type
      storage_refund_amount
      metadata {
        asset_type
        decimals
        symbol
      }
    }
  }
`;

export interface FungibleAssetActivity {
  amount: number;
  entry_function_id_str: string;
  gas_fee_payer_address?: string;
  is_frozen?: boolean;
  asset_type: string;
  event_index: number;
  owner_address: string;
  transaction_timestamp: string;
  transaction_version: number;
  type: string;
  storage_refund_amount: number;
  metadata?: {
    asset_type: string;
    decimals: number;
    symbol: string;
  };
}

interface TransactionResponse {
  fungible_asset_activities: Array<FungibleAssetActivity>;
}

export function useGetTransactionBalanceChanges(txn_version: string | number) {
  const { loading, error, data } = useGraphqlQuery<TransactionResponse>(
    TRANSACTION_BALANCE_CHANGES_QUERY,
    { variables: { txn_version: txn_version } },
  );

  return {
    isLoading: loading,
    error,
    data,
  };
}

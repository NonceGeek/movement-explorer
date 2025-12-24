import { gql } from "@apollo/client";
import { useQuery as useGraphqlQuery } from "@apollo/client/react";

const TOKEN_DATA_QUERY = gql`
  query TokenData($tokenDataId: String!) {
    current_token_datas_v2(where: { token_data_id: { _eq: $tokenDataId } }) {
      token_data_id
      token_name
      token_uri
      description
      token_standard
      collection_id
      current_collection {
        collection_name
        creator_address
        description
        uri
      }
      token_properties
      decimals
      largest_property_version_v1
      supply
      is_fungible_v2
      last_transaction_version
      last_transaction_timestamp
    }
  }
`;

export interface TokenData {
  token_data_id: string;
  token_name: string;
  token_uri: string;
  description: string;
  token_standard: string;
  collection_id: string;
  current_collection?: {
    collection_name: string;
    creator_address: string;
    description: string;
    uri: string;
  };
  token_properties: Record<string, unknown>;
  decimals: number;
  largest_property_version_v1: string;
  supply: number;
  is_fungible_v2: boolean;
  last_transaction_version: number;
  last_transaction_timestamp: string;
}

interface TokenDataResponse {
  current_token_datas_v2: TokenData[];
}

export function useGetTokenData(tokenDataId?: string) {
  const { loading, error, data } = useGraphqlQuery<TokenDataResponse>(
    TOKEN_DATA_QUERY,
    {
      variables: { tokenDataId },
      skip: !tokenDataId,
    }
  );

  return {
    isLoading: loading,
    error,
    data: data?.current_token_datas_v2,
  };
}

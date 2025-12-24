import { gql } from "@apollo/client";
import { useQuery as useGraphqlQuery } from "@apollo/client/react";

const ACCOUNT_TOKENS_QUERY = gql`
  query AccountTokens($address: String!, $limit: Int!, $offset: Int) {
    current_token_ownerships_v2(
      where: { owner_address: { _eq: $address }, amount: { _gt: 0 } }
      limit: $limit
      offset: $offset
      order_by: [{ last_transaction_version: desc }, { token_data_id: desc }]
    ) {
      token_data_id
      amount
      token_standard
      property_version_v1
      current_token_data {
        token_name
        token_uri
        description
        collection_id
        current_collection {
          collection_name
          creator_address
        }
      }
      last_transaction_version
    }
  }
`;

const ACCOUNT_TOKENS_COUNT_QUERY = gql`
  query AccountTokensCount($address: String!) {
    current_token_ownerships_v2_aggregate(
      where: { owner_address: { _eq: $address }, amount: { _gt: 0 } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export interface TokenOwnership {
  token_data_id: string;
  amount: number;
  token_standard: string;
  property_version_v1: number;
  current_token_data?: {
    token_name: string;
    token_uri: string;
    description: string;
    collection_id: string;
    current_collection?: {
      collection_name: string;
      creator_address: string;
    };
  };
  last_transaction_version: number;
}

interface AccountTokensResponse {
  current_token_ownerships_v2: TokenOwnership[];
}

interface AccountTokensCountResponse {
  current_token_ownerships_v2_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export function useGetAccountTokens(
  address: string,
  limit: number = 25,
  offset: number = 0
) {
  const { loading, error, data } = useGraphqlQuery<AccountTokensResponse>(
    ACCOUNT_TOKENS_QUERY,
    {
      variables: { address, limit, offset },
      skip: !address,
    }
  );

  return {
    isLoading: loading,
    error,
    data: data?.current_token_ownerships_v2 ?? [],
  };
}

export function useGetAccountTokensCount(address: string) {
  const { loading, error, data } = useGraphqlQuery<AccountTokensCountResponse>(
    ACCOUNT_TOKENS_COUNT_QUERY,
    {
      variables: { address },
      skip: !address,
    }
  );

  return {
    isLoading: loading,
    error,
    count: data?.current_token_ownerships_v2_aggregate?.aggregate?.count ?? 0,
  };
}

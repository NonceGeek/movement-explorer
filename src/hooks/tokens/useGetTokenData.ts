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
        collection_id
        collection_name
        creator_address
        description
        uri
        current_supply
        max_supply
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

const TOKEN_OWNERS_QUERY = gql`
  query TokenOwners($tokenDataId: String!) {
    current_token_ownerships_v2(
      where: { token_data_id: { _eq: $tokenDataId }, amount: { _gt: 0 } }
    ) {
      owner_address
      amount
    }
  }
`;

const TOKEN_ACTIVITIES_QUERY = gql`
  query TokenActivities($tokenDataId: String!, $limit: Int!, $offset: Int) {
    token_activities_v2(
      where: { token_data_id: { _eq: $tokenDataId } }
      order_by: { transaction_version: desc }
      limit: $limit
      offset: $offset
    ) {
      transaction_version
      type
      from_address
      to_address
      property_version_v1
      token_amount
      transaction_timestamp
    }
  }
`;

const TOKEN_ACTIVITIES_COUNT_QUERY = gql`
  query TokenActivitiesCount($tokenDataId: String!) {
    token_activities_v2_aggregate(
      where: { token_data_id: { _eq: $tokenDataId } }
    ) {
      aggregate {
        count
      }
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
    collection_id: string;
    collection_name: string;
    creator_address: string;
    description: string;
    uri: string;
    current_supply: number;
    max_supply: number | null;
  };
  token_properties: Record<string, unknown>;
  decimals: number;
  largest_property_version_v1: string;
  supply: number;
  is_fungible_v2: boolean;
  last_transaction_version: number;
  last_transaction_timestamp: string;
}

export interface TokenOwner {
  owner_address: string;
  amount: number;
}

export interface TokenActivity {
  transaction_version: number;
  type: string;
  from_address: string | null;
  to_address: string | null;
  property_version_v1: number;
  token_amount: number;
  transaction_timestamp: string;
}

interface TokenDataResponse {
  current_token_datas_v2: TokenData[];
}

interface TokenOwnersResponse {
  current_token_ownerships_v2: TokenOwner[];
}

interface TokenActivitiesResponse {
  token_activities_v2: TokenActivity[];
}

interface TokenActivitiesCountResponse {
  token_activities_v2_aggregate: {
    aggregate: {
      count: number;
    };
  };
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

export function useGetTokenOwners(tokenDataId?: string) {
  const { loading, error, data } = useGraphqlQuery<TokenOwnersResponse>(
    TOKEN_OWNERS_QUERY,
    {
      variables: { tokenDataId },
      skip: !tokenDataId,
    }
  );

  return {
    isLoading: loading,
    error,
    data: data?.current_token_ownerships_v2 ?? [],
  };
}

export function useGetTokenActivities(
  tokenDataId: string,
  limit: number = 20,
  offset: number = 0
) {
  const { loading, error, data } = useGraphqlQuery<TokenActivitiesResponse>(
    TOKEN_ACTIVITIES_QUERY,
    {
      variables: { tokenDataId, limit, offset },
      skip: !tokenDataId,
    }
  );

  return {
    isLoading: loading,
    error,
    data: data?.token_activities_v2 ?? [],
  };
}

export function useGetTokenActivitiesCount(tokenDataId?: string) {
  const { loading, error, data } =
    useGraphqlQuery<TokenActivitiesCountResponse>(TOKEN_ACTIVITIES_COUNT_QUERY, {
      variables: { tokenDataId },
      skip: !tokenDataId,
    });

  return {
    isLoading: loading,
    error,
    count: data?.token_activities_v2_aggregate?.aggregate?.count ?? 0,
  };
}

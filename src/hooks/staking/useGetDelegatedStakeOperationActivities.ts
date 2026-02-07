import { gql } from "@apollo/client";
import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { standardizeAddress } from "@/utils";

export interface DelegatedStakingActivity {
  amount: string;
  delegator_address: string;
  event_index: number;
  event_type: string;
  pool_address: string;
  transaction_version: string;
}

const STAKING_ACTIVITIES_QUERY = gql`
  query DelegatedStakingActivities(
    $delegatorAddress: String
    $poolAddress: String
  ) {
    delegated_staking_activities(
      where: {
        delegator_address: { _eq: $delegatorAddress }
        pool_address: { _eq: $poolAddress }
      }
      order_by: { transaction_version: desc }
    ) {
      amount
      delegator_address
      event_index
      event_type
      pool_address
      transaction_version
    }
  }
`;

interface ActivitiesQueryResult {
  delegated_staking_activities: DelegatedStakingActivity[];
}

export function useGetDelegatedStakeOperationActivities(
  delegatorAddress: string,
  poolAddress: string,
): {
  activities: DelegatedStakingActivity[];
  loading: boolean;
  error: Error | undefined;
} {
  const standardizedDelegator = delegatorAddress
    ? standardizeAddress(delegatorAddress)
    : "";
  const standardizedPool = poolAddress
    ? standardizeAddress(poolAddress)
    : "";

  const { data, loading, error } =
    useGraphqlQuery<ActivitiesQueryResult>(STAKING_ACTIVITIES_QUERY, {
      variables: {
        delegatorAddress: standardizedDelegator,
        poolAddress: standardizedPool,
      },
      skip: !delegatorAddress || !poolAddress,
    });

  return {
    activities: data?.delegated_staking_activities ?? [],
    loading,
    error,
  };
}

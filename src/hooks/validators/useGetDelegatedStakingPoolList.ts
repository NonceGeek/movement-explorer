import { gql } from "@apollo/client";
import { useQuery as useGraphqlQuery } from "@apollo/client/react";

export interface DelegatedStakingPool {
  staking_pool_address: string;
  current_staking_pool: {
    operator_address: string;
  };
}

const VALIDATOR_LIST_QUERY = gql`
  query DelegationPools {
    delegated_staking_pools {
      staking_pool_address
      current_staking_pool {
        operator_address
      }
    }
  }
`;

interface DelegationPoolsQueryResult {
  delegated_staking_pools: DelegatedStakingPool[];
}

export function useGetDelegatedStakingPoolList(): {
  delegatedStakingPools: DelegatedStakingPool[];
  loading: boolean;
} {
  const { data, error, loading } =
    useGraphqlQuery<DelegationPoolsQueryResult>(VALIDATOR_LIST_QUERY);
  if (error) {
    return { delegatedStakingPools: [], loading };
  }

  return {
    delegatedStakingPools:
      (data?.delegated_staking_pools as DelegatedStakingPool[]) ?? [],
    loading,
  };
}

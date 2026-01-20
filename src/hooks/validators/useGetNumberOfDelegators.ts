import { Types } from "aptos";
import { gql } from "@apollo/client";
import { useQuery as useGraphqlQuery } from "@apollo/client/react";
import { standardizeAddress } from "@/utils";

const NUMBER_OF_DELEGATORS_QUERY = gql`
  query numberOfDelegatorsQuery($poolAddress: String) {
    num_active_delegator_per_pool(
      where: {
        pool_address: { _eq: $poolAddress }
        num_active_delegator: { _gt: "0" }
      }
      distinct_on: pool_address
    ) {
      num_active_delegator
    }
  }
`;

interface DelegatorQueryResult {
  num_active_delegator_per_pool: Array<{
    num_active_delegator: number;
  }>;
}

export function useGetNumberOfDelegators(poolAddress: Types.Address): {
  delegatorBalance: number;
  loading: boolean;
  error: Error | undefined;
} {
  const poolAddress64Hash = standardizeAddress(poolAddress);

  const { loading, error, data } = useGraphqlQuery<DelegatorQueryResult>(
    NUMBER_OF_DELEGATORS_QUERY,
    {
      variables: {
        poolAddress: poolAddress64Hash,
      },
    },
  );

  return {
    delegatorBalance:
      data?.num_active_delegator_per_pool &&
      data.num_active_delegator_per_pool.length > 0
        ? data.num_active_delegator_per_pool[0].num_active_delegator
        : 0,
    loading,
    error,
  };
}

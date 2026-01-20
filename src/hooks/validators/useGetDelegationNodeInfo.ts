import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { getValidatorCommission, getValidatorState } from "@/services/staking";
import { useGlobalStore } from "@/store/useGlobalStore";

type DelegationNodeInfoResponse = {
  commission: number | undefined;
  isQueryLoading: boolean;
  validatorStatus: Types.MoveValue[] | undefined;
  error: Error | null;
};

type DelegationNodeInfoProps = {
  validatorAddress: Types.Address;
};

export function useGetDelegationNodeInfo({
  validatorAddress,
}: DelegationNodeInfoProps): DelegationNodeInfoResponse {
  const { aptos_client, network_value } = useGlobalStore();

  const commissionQuery = useQuery<Types.MoveValue[], Error, number>({
    queryKey: ["validatorCommission", network_value, validatorAddress],
    queryFn: () => getValidatorCommission(aptos_client, validatorAddress),
    select: (res: Types.MoveValue[]) => Number(res ? res[0] : 0) / 100, // commission rate: 22.85% is represented as 2285
    enabled: !!validatorAddress,
  });

  const stateQuery = useQuery<Types.MoveValue[], Error>({
    queryKey: ["validatorState", network_value, validatorAddress],
    queryFn: () => getValidatorState(aptos_client, validatorAddress),
    enabled: !!validatorAddress,
  });

  return {
    isQueryLoading: commissionQuery.isLoading || stateQuery.isLoading,
    error: commissionQuery.error || stateQuery.error,
    commission: commissionQuery.data,
    validatorStatus: stateQuery.data,
  };
}

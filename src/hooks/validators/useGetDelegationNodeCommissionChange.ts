import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { getValidatorCommissionChange } from "@/services/staking";
import { useGlobalStore } from "@/store/useGlobalStore";

type CommissionChangeResponse = {
  nextCommission: number | undefined;
  isQueryLoading: boolean;
  error: Error | null;
};

type CommissionChangeProps = {
  validatorAddress: Types.Address;
};

export function useGetDelegationNodeCommissionChange({
  validatorAddress,
}: CommissionChangeProps): CommissionChangeResponse {
  const { aptos_client, network_value } = useGlobalStore();

  const query = useQuery<Types.MoveValue[], Error, number>({
    queryKey: ["validatorCommissionChange", network_value, validatorAddress],
    queryFn: () => getValidatorCommissionChange(aptos_client, validatorAddress),
    select: (res: Types.MoveValue[]) => Number(res ? res[0] : 0) / 100,
    enabled: !!validatorAddress,
  });

  return {
    nextCommission: query.data,
    isQueryLoading: query.isLoading,
    error: query.error,
  };
}

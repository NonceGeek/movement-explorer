import { Types } from "aptos";
import { useState, useEffect } from "react";
import { useGlobalStore } from "@/store/useGlobalStore";

export function useGetDelegatorStakeInfo(
  delegatorAddress: string,
  validatorAddress: string
) {
  const { aptos_client } = useGlobalStore();
  const [stakes, setStakes] = useState<Types.MoveValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!delegatorAddress || !validatorAddress) {
        setStakes([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await aptos_client.view({
          function: "0x1::delegation_pool::get_stake",
          type_arguments: [],
          arguments: [validatorAddress, delegatorAddress],
        });
        setStakes(result);
      } catch (error) {
        console.error("Failed to get stake info:", error);
        setStakes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [aptos_client, delegatorAddress, validatorAddress]);

  return { stakes, isLoading };
}

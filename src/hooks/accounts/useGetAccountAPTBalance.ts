import { Types } from "aptos";
import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { getBalance } from "../../services";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetAccountAPTBalance(address: Types.Address) {
  const { network_value, sdk_v2_client } = useGlobalStore();

  return useQuery<string, ResponseError>({
    queryKey: ["aptBalance", { address }, network_value],
    queryFn: () => getBalance(sdk_v2_client, address),
    retry: false,
  });
}

/**
 * Get unified MOVE balance (v1 Coin + v2 Fungible Asset)
 * Uses coin::balance view function which returns the total balance
 * combining both CoinStore (v1) and FungibleStore (v2) balances.
 */
export function useGetUnifiedMOVEBalance(address: Types.Address) {
  // coin::balance returns the correct total (v1 Coin + v2 FA)
  // This is the ground truth for the user's total MOVE balance
  return useGetAccountAPTBalance(address);
}

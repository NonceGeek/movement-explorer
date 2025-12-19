import { Types } from "aptos";
import { useQuery } from "@tanstack/react-query";
import { getAccount } from "../../services";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetAccount(
  address: string,
  options?: { retry?: number | boolean }
) {
  const { network_value, aptos_client } = useGlobalStore();

  return useQuery<Types.AccountData, ResponseError>({
    queryKey: ["account", { address }, network_value],
    queryFn: () => getAccount({ address }, aptos_client),
    retry: options?.retry ?? false,
  });
}

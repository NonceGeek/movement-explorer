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

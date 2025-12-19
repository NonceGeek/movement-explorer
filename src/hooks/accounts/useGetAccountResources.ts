import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getAccountResources } from "../../services";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetAccountResources(
  address: string,
  options?: {
    retry?: number | boolean;
  }
): UseQueryResult<Types.MoveResource[], ResponseError> {
  const { network_value, aptos_client } = useGlobalStore();

  return useQuery<Array<Types.MoveResource>, ResponseError>({
    queryKey: ["accountResources", { address }, network_value],
    queryFn: () => getAccountResources({ address }, aptos_client),
    retry: options?.retry ?? false,
  });
}

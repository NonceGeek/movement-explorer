import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getAccountTransactions } from "../../services";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetAccountTransactions(
  address: string,
  start?: number,
  limit?: number
): UseQueryResult<Array<Types.Transaction>, ResponseError> {
  const { network_value, aptos_client } = useGlobalStore();

  return useQuery<Array<Types.Transaction>, ResponseError>({
    queryKey: ["accountTransactions", { address, start, limit }, network_value],
    queryFn: () =>
      getAccountTransactions({ address, start, limit }, aptos_client),
  });
}

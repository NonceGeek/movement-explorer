import { Types } from "aptos";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getTransaction } from "../../services";
import { ResponseError, ResponseErrorType } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetTransaction(
  txnHashOrVersion: string,
  options?: Omit<
    UseQueryOptions<Types.Transaction, ResponseError>,
    "queryKey" | "queryFn"
  >
) {
  const { network_value, aptos_client } = useGlobalStore();

  return useQuery<Types.Transaction, ResponseError>({
    queryKey: ["transaction", { txnHashOrVersion }, network_value],
    queryFn: () => getTransaction({ txnHashOrVersion }, aptos_client),
    retry: (failureCount, error) => {
      // Don't retry on "not found" errors
      if (error?.type === ResponseErrorType.NOT_FOUND) {
        return false;
      }
      // Default: retry up to 3 times for other errors
      return failureCount < 3;
    },
    ...options,
  });
}

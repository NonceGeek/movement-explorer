import { Types } from "aptos";
import { useQuery } from "@tanstack/react-query";
import { getTransaction } from "../../services";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetTransaction(txnHashOrVersion: string) {
  const { network_value, aptos_client } = useGlobalStore();

  return useQuery<Types.Transaction, ResponseError>({
    queryKey: ["transaction", { txnHashOrVersion }, network_value],
    queryFn: () => getTransaction({ txnHashOrVersion }, aptos_client),
  });
}

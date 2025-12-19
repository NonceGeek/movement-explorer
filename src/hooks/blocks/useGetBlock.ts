import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { getBlockByHeight, getBlockByVersion } from "../../services";
import { Block } from "@aptos-labs/ts-sdk";

export function useGetBlockByHeight({
  height,
  withTransactions = true,
}: {
  height: number;
  withTransactions?: boolean;
}) {
  const { network_value, sdk_v2_client } = useGlobalStore();

  return useQuery<Block, ResponseError>({
    queryKey: ["block", height, network_value],
    queryFn: () =>
      getBlockByHeight({ height, withTransactions }, sdk_v2_client),
    refetchInterval: 1200000,
  });
}

export function useGetBlockByVersion({
  version,
  withTransactions = true,
}: {
  version: number;
  withTransactions?: boolean;
}) {
  const { network_value, sdk_v2_client } = useGlobalStore();

  return useQuery<Block, ResponseError>({
    queryKey: ["block", version, network_value],
    queryFn: () =>
      getBlockByVersion({ version, withTransactions }, sdk_v2_client),
  });
}

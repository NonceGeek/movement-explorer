import { useGlobalStore } from "../../store/useGlobalStore";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "../../services";
import { useGetTPSByBlockHeight } from "./useGetTPSByBlockHeight";
import { useGetAnalyticsData } from "./useGetAnalyticsData";

export function useGetTPS() {
  const { network_value, aptos_client } = useGlobalStore();
  const [blockHeight, setBlockHeight] = useState<number | undefined>();
  const { tps } = useGetTPSByBlockHeight(blockHeight);

  const { data: ledgerData } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 10000,
  });
  const currentBlockHeight = ledgerData?.block_height;

  useEffect(() => {
    if (currentBlockHeight !== undefined) {
      setBlockHeight(parseInt(currentBlockHeight));
    }
  }, [currentBlockHeight, network_value]);

  return { tps };
}

export function useGetPeakTPS() {
  const data = useGetAnalyticsData();

  return {
    peakTps:
      data?.max_tps_15_blocks_in_past_30_days?.[0]
        ?.max_tps_15_blocks_in_past_30_days,
  };
}

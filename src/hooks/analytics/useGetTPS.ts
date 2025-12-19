import { useGlobalStore } from "../../store/useGlobalStore";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "../../services";
import { useGetTPSByBlockHeight } from "./useGetTPSByBlockHeight";
import {
  AnalyticsData,
  ANALYTICS_DATA_URL,
  BARDOCK_ANALYTICS_DATA_URL,
} from "./useGetAnalyticsData";
import { availableNetworks } from "../../constants";

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
  const { network_name } = useGlobalStore();
  const [peakTps, setPeakTps] = useState<number>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const showNetworks: any[] = availableNetworks;
    if (showNetworks.includes(network_name)) {
      const fetchData = async () => {
        let ANALYTICS_DATA_URL_USE;
        switch (network_name) {
          case "bardock testnet":
            ANALYTICS_DATA_URL_USE = BARDOCK_ANALYTICS_DATA_URL;
            break;
          default:
            ANALYTICS_DATA_URL_USE = ANALYTICS_DATA_URL;
            break;
        }

        const response = await fetch(ANALYTICS_DATA_URL_USE);
        const data: AnalyticsData = await response.json();
        const peakTps =
          data.max_tps_15_blocks_in_past_30_days[0]
            .max_tps_15_blocks_in_past_30_days;
        setPeakTps(peakTps);
      };

      fetchData().catch((error) => {
        console.error("ERROR!", error, typeof error);
      });
    } else {
      setPeakTps(undefined);
    }
  }, [network_name]);

  return { peakTps };
}

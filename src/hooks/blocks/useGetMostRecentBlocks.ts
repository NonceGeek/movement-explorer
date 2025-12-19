import { useGlobalStore } from "../../store/useGlobalStore";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo, getRecentBlocks } from "../../services";
import { Types } from "aptos";

export function useGetMostRecentBlocks(
  start: string | undefined,
  count: number
) {
  const { network_value, aptos_client } = useGlobalStore();
  const [recentBlocks, setRecentBlocks] = useState<Types.Block[]>([]);

  const { isLoading: isLoadingLedgerData, data: ledgerData } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
  });
  const currentBlockHeight = parseInt(start ?? ledgerData?.block_height ?? "");

  useEffect(() => {
    async function fetchData() {
      // Need to check specific undefined/NaN conditions
      if (!isNaN(currentBlockHeight) && !isLoadingLedgerData) {
        const blocks = await getRecentBlocks(
          currentBlockHeight,
          count,
          aptos_client
        );
        setRecentBlocks(blocks);
      }
    }
    fetchData();
  }, [
    currentBlockHeight,
    aptos_client, // Replaced state with aptos_client dependency
    count,
    isLoadingLedgerData,
  ]);

  return {
    recentBlocks,
    isLoading: isLoadingLedgerData || recentBlocks.length < 1,
  };
}

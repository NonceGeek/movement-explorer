import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { Loader2 } from "lucide-react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransactions, getLedgerInfo } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { Button } from "@movementlabsxyz/movement-design-system";

const LIMIT = 20;

export function AllTransactions() {
  const { aptos_client, network_value } = useGlobalStore();
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Fetch ledger info to get max version
  const { data: ledgerInfo, isLoading: isLedgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
  });

  const maxVersion = ledgerInfo ? parseInt(ledgerInfo.ledger_version) : 0;
  const initialStart = Math.max(0, maxVersion - LIMIT + 1);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isTxLoading,
  } = useInfiniteQuery({
    queryKey: ["transactions", "infinite", network_value, maxVersion],
    queryFn: async ({ pageParam }) => {
      // Ensure we don't request negative start
      return getTransactions(
        { start: pageParam.start, limit: pageParam.limit },
        aptos_client,
      );
    },
    initialPageParam: { start: initialStart, limit: LIMIT },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPageParam.start === 0) return undefined;

      const nextStart = lastPageParam.start - LIMIT;
      if (nextStart >= 0) {
        return { start: nextStart, limit: LIMIT };
      }
      // Partial page at the end (from 0 to lastStart-1)
      // The limit should be equal to the previous start version to cover 0 to start-1
      return { start: 0, limit: lastPageParam.start };
    },
    enabled: maxVersion > 0,
  });

  const isLoading = isLedgerLoading || (isTxLoading && maxVersion > 0);

  // Flatten data
  const flatTransactions = data?.pages.flatMap((page) => page) ?? [];

  // Transform transactions to TransactionRowData format
  const tableData: TransactionRowData[] = flatTransactions.map((tx) => ({
    version: "version" in tx ? parseInt(tx.version) : 0,
    transaction: tx,
  }));

  return (
    <>
      <div className="overflow-x-auto">
        <TransactionTable
          data={tableData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={LIMIT}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
          animationMode="none"
        />
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useIsFetching,
  UseInfiniteQueryResult,
  InfiniteData,
} from "@tanstack/react-query";
import { Types } from "aptos";
import { Loader2 } from "lucide-react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransactions, getLedgerInfo } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
  NewDataNotification,
} from "@/components/transactions";
import { Button } from "@movementlabsxyz/movement-design-system";

const LIMIT = 20;
const POLL_INTERVAL = 3000;

interface AllTransactionsProps {
  headerEndDecorator?: React.ReactNode;
}

export function AllTransactions({ headerEndDecorator }: AllTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const isListFetching =
    useIsFetching({ queryKey: ["transactions", "infinite", network_value] }) >
    0;

  // State for manual refresh
  // frozenMaxVersion is the anchor for the current list
  const [frozenMaxVersion, setFrozenMaxVersion] = useState<number>(0);
  const [highlightedVersions, setHighlightedVersions] = useState<Set<number>>(
    new Set(),
  );

  // Poll ledger info to detect new transactions
  const { data: ledgerInfo, isLoading: isLedgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: POLL_INTERVAL,
    enabled: !isListFetching,
  });

  const latestMaxVersion = ledgerInfo ? parseInt(ledgerInfo.ledger_version) : 0;

  // Initialize frozenMaxVersion once on first load
  useEffect(() => {
    if (frozenMaxVersion === 0 && latestMaxVersion > 0) {
      setFrozenMaxVersion(latestMaxVersion);
    }
  }, [latestMaxVersion, frozenMaxVersion]);

  // Calculate new transactions count
  // If frozenMaxVersion is 0, we don't calculate new count yet to avoid showing banner on init
  const newCount =
    frozenMaxVersion > 0 ? Math.max(0, latestMaxVersion - frozenMaxVersion) : 0;

  // Use frozenMaxVersion for the list query to keep it stable
  // If frozenMaxVersion is 0 (initial), use latestMaxVersion (which might also be 0, but usually not for long)
  // We use max(0, ver) to be safe
  const queryMaxVersion =
    frozenMaxVersion > 0 ? frozenMaxVersion : latestMaxVersion;
  const initialStart = Math.max(0, queryMaxVersion - LIMIT + 1);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading: isTxLoading,
  }: UseInfiniteQueryResult<
    InfiniteData<Types.Transaction[]>,
    Error
  > = useInfiniteQuery({
    queryKey: ["transactions", "infinite", network_value, queryMaxVersion],
    queryFn: async ({ pageParam }) => {
      // Ensure we don't request negative start
      return getTransactions(
        { start: pageParam.start, limit: pageParam.limit },
        aptos_client,
      );
    },
    initialPageParam: { start: initialStart, limit: LIMIT },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // If we don't have a stable anchor yet, don't paginate
      if (queryMaxVersion === 0) return undefined;

      if (lastPageParam.start === 0) return undefined;

      const nextStart = lastPageParam.start - LIMIT;
      if (nextStart >= 0) {
        return { start: nextStart, limit: LIMIT };
      }
      // Partial page at the end
      return { start: 0, limit: lastPageParam.start };
    },
    enabled: queryMaxVersion > 0,
  });

  const isLoading =
    (isLedgerLoading && frozenMaxVersion === 0) ||
    (isTxLoading && queryMaxVersion > 0);

  // Handle Refresh Click
  const handleRefresh = () => {
    // Determine new versions to highlight
    // The new versions are typically from (frozenMaxVersion + 1) to latestMaxVersion
    // But we only show the first page (LIMIT items).
    // If newCount > LIMIT, we highlight all on page 1 that are > oldFrozen

    const newVersions = new Set<number>();
    // We can't know exactly which versions are available without fetching,
    // but we can estimate the range.
    // Highlighting logic relies on the row data. We can just pass the set of expected version numbers.
    for (let v = frozenMaxVersion + 1; v <= latestMaxVersion; v++) {
      newVersions.add(v);
    }

    setHighlightedVersions(newVersions);
    setFrozenMaxVersion(latestMaxVersion);

    // Clear highlight after animation (2000ms match the CSS animation)
    setTimeout(() => {
      setHighlightedVersions(new Set());
    }, 2500);
  };

  // Flatten data
  const flatTransactions = data?.pages.flatMap((page) => page) ?? [];

  // Transform transactions to TransactionRowData format
  const tableData: TransactionRowData[] = flatTransactions.map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return {
      version,
      transaction: tx,
      isHighlighted: highlightedVersions.has(version),
    };
  });

  // Only show loading spinner on banner if we are refreshing the main list (fetching first page)
  const isRefreshing = isFetching && !isFetchingNextPage;

  return (
    <>
      <div className="flex flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-3xl font-bold">All Transactions</h1>
          <NewDataNotification
            visible={newCount > 0}
            count={newCount}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            dataType="txs"
          />
        </div>
        {headerEndDecorator}
      </div>

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
          animationMode="realtime"
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

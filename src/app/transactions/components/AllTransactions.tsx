"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useQuery,
  useIsFetching,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import { getTransactions, getLedgerInfo } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
  TransactionTableToolbar,
  TransactionTableFooter,
} from "@/components/transactions";
import { NewDataNotification } from "@/components/common/NewDataNotification";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";

const POLL_INTERVAL = 3000;

interface AllTransactionsProps {
  headerEndDecorator?: React.ReactNode;
}

export function AllTransactions({ headerEndDecorator }: AllTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Get page from URL or default to 1
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1;

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? (parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE
    : pageSize;

  // Frozen version for stable pagination
  const [frozenMaxVersion, setFrozenMaxVersion] = useState<number>(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const isListFetching =
    useIsFetching({ queryKey: ["transactions", "paged", network_value] }) > 0;

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

  const hasNewData =
    frozenMaxVersion > 0 && latestMaxVersion > frozenMaxVersion;

  const queryMaxVersion =
    frozenMaxVersion > 0 ? frozenMaxVersion : latestMaxVersion;

  // Calculate start position for current page (descending order)
  const getStartForPage = useCallback(
    (page: number) => {
      if (queryMaxVersion === 0) return 0;
      // Page 1 shows newest transactions (highest versions)
      // Page 2 shows older transactions, etc.
      const startVersion =
        queryMaxVersion - (page - 1) * currentLimit - currentLimit + 1;
      return Math.max(0, startVersion);
    },
    [queryMaxVersion, currentLimit]
  );

  // Fetch transactions for current page
  const {
    data: fetchedData,
    isLoading: isTxLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "transactions",
      "paged",
      network_value,
      queryMaxVersion,
      currentPage,
      currentLimit,
    ],
    queryFn: async () => {
      const start = getStartForPage(currentPage);
      const transactions = await getTransactions(
        { start: Math.max(0, start), limit: currentLimit },
        aptos_client
      );
      return { transactions };
    },
    enabled: queryMaxVersion > 0,
    placeholderData: keepPreviousData,
  });

  const transactions = fetchedData?.transactions ?? [];

  // Calculate real total pages from ledger version
  const totalPages =
    queryMaxVersion > 0
      ? Math.ceil(queryMaxVersion / currentLimit)
      : undefined;

  const isLoading =
    (isLedgerLoading && frozenMaxVersion === 0) ||
    (isTxLoading && queryMaxVersion > 0);

  // Transform transactions to table data (reverse to show newest first, take only currentLimit)
  const tableData: TransactionRowData[] = transactions
    .slice(0, currentLimit)
    .reverse()
    .map((tx) => {
      const version = "version" in tx ? parseInt(tx.version) : 0;
      return { version, transaction: tx };
    });

  // Update isFirstLoad
  useEffect(() => {
    if (!isTxLoading && transactions.length > 0) {
      setIsFirstLoad(false);
    }
  }, [isTxLoading, transactions]);

  const isRefreshing = isFetching && !isFirstLoad;

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`/transactions?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1) {
        updateURL(page, currentLimit);
      }
    },
    [currentLimit, updateURL]
  );

  const handlePageSizeChange = useCallback(
    (size: PageSize) => {
      setPageSize(size);
      // Reset to page 1 when changing page size
      updateURL(1, size);
    },
    [setPageSize, updateURL]
  );

  const handleRefresh = () => {
    setFrozenMaxVersion(latestMaxVersion);
    // Reset to page 1 on refresh
    updateURL(1, currentLimit);
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-3xl font-bold">All Transactions</h1>
          <NewDataNotification
            visible={hasNewData}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          />
        </div>
        {headerEndDecorator}
      </div>

      {/* Top Toolbar */}
      <TransactionTableToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        transactions={tableData}
        isLoading={isLoading}
        infoText={
          queryMaxVersion > 0 && (
            <>
              More than{" "}
              <span className="font-medium text-foreground">
                {queryMaxVersion.toLocaleString()}
              </span>{" "}
              transactions found
            </>
          )
        }
      />

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TableLoadingBar visible={isFetching && !isLoading} />
        <TransactionTable
          data={tableData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={currentLimit}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
        />
      </div>

      {/* Bottom Footer */}
      <TransactionTableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageSize={currentLimit}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </>
  );
}

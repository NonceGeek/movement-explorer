"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import { useGetFungibleAssetActivitiesByVersions } from "@/hooks/accounts/useGetFungibleAssetActivitiesByVersions";
import { useGetAccountCoinTransfers } from "@/hooks/accounts/useGetAccountCoinTransfers";
import { useGetAccountCoinTransfersCount } from "@/hooks/accounts/useGetAccountCoinTransfersCount";
import { useGetAccountCoinTransferTokenOptions } from "@/hooks/accounts/useGetAccountCoinTransferTokenOptions";
import { ColumnFilters } from "@/components/transactions";
import {
  DateRangeColumnFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import { CoinColumnFilter } from "@/components/transactions/filters/CoinColumnFilter";
import { AddressColumnFilter } from "@/components/transactions/filters/AddressColumnFilter";
import { TransactionTableToolbar } from "@/components/transactions/TransactionTableToolbar";
import { TransactionTableFooter } from "@/components/transactions/TransactionTableFooter";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { ArrowLeft, X } from "lucide-react";
import { AccountTokenTransfersTable } from "./AccountTokenTransfersTable";

const MAX_PAGES = 100;

interface AccountCoinTransfersProps {
  address: string;
  headerEndDecorator?: React.ReactNode;
}

export function AccountCoinTransfers({
  address,
  headerEndDecorator,
}: AccountCoinTransfersProps) {
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const [coinFilter, setCoinFilter] = useState<string | null>(null);
  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const { data: tokenOptions, isLoading: tokenOptionsLoading } =
    useGetAccountCoinTransferTokenOptions(address);

  // Get page from URL or default to 1, capped at MAX_PAGES
  const pageParam = searchParams.get("page");
  const currentPage = Math.min(
    MAX_PAGES,
    pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1,
  );

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? (parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE
    : pageSize;

  // Get optional coinType filter from URL (seed the coinFilter state on first render)
  const coinTypeParam = searchParams.get("coinType");
  const activeCoin = coinFilter ?? coinTypeParam;

  // Fetch count
  const { data: txCount, isLoading: countLoading } =
    useGetAccountCoinTransfersCount(
      address,
      activeCoin,
      dateRange.from,
      dateRange.to,
      senderFilter,
    );
  const totalCount = txCount ?? 0;
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(totalCount / currentLimit)),
  );

  // Fetch transfer transaction versions for current page
  const offset = (currentPage - 1) * currentLimit;
  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountCoinTransfers(
      address,
      currentLimit,
      offset,
      activeCoin,
      dateRange.from,
      dateRange.to,
      senderFilter,
    );

  const activeVersions = Array.from(new Set(transactionVersions || []));
  const { data: relatedActivities, isLoading: relatedActivitiesLoading } =
    useGetFungibleAssetActivitiesByVersions(activeVersions);

  // Fetch full transaction details
  const { aptos_client } = useGlobalStore();
  const { data: transactions, isLoading: detailsLoading } = useQuery({
    queryKey: ["accountCoinTransferDetails", address, activeVersions],
    queryFn: async () => {
      if (activeVersions.length === 0) return [];
      return Promise.all(
        activeVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );
    },
    enabled: activeVersions.length > 0,
  });

  const isLoading =
    versionsLoading || relatedActivitiesLoading || detailsLoading;

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1) {
        updateURL(page, currentLimit);
      }
    },
    [currentLimit, updateURL],
  );

  const handlePageSizeChange = useCallback(
    (size: PageSize) => {
      setPageSize(size);
      updateURL(1, size);
    },
    [setPageSize, updateURL],
  );

  // Reset to page 1 when filters change
  const filterKey = `${dateRange.from}-${dateRange.to}-${activeCoin}-${senderFilter}`;
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (currentPage !== 1) {
        handlePageChange(1);
      }
    }
  }, [filterKey, currentPage, handlePageChange]);

  const hasActiveFilters =
    dateRange.from !== null || coinFilter !== null || senderFilter !== null;

  const clearAllFilters = () => {
    setDateRange({ from: null, to: null });
    setCoinFilter(null);
    setSenderFilter(null);
  };

  const columnFilters: ColumnFilters = {
    timestamp: (
      <DateRangeColumnFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        timestampMode={timestampMode}
        onToggleTimestampMode={setTimestampMode}
      />
    ),
    token: (
      <CoinColumnFilter
        value={activeCoin}
        onChange={setCoinFilter}
        tokens={tokenOptions}
        isLoading={tokenOptionsLoading}
      />
    ),
    sender: (
      <AddressColumnFilter
        label="Sender"
        value={senderFilter}
        onChange={setSenderFilter}
      />
    ),
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/account/${address}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold">Token Transfers</h1>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-8">
          <CopyableAddress address={address} showCopyButton variant="muted" />
        </div>
        {headerEndDecorator}
      </div>

      {/* Top Toolbar */}
      <TransactionTableToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        transactions={[]}
        isLoading={isLoading}
        infoText={
          <div className="flex items-center gap-2">
            {countLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted" />
                token transfers found
              </span>
            ) : (
              totalCount > 0 && (
                <span>
                  <span className="font-medium text-foreground">
                    {totalCount.toLocaleString()}
                  </span>{" "}
                  token transfers found
                </span>
              )
            )}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
                filtered
              </button>
            )}
          </div>
        }
      />

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TableLoadingBar visible={!isLoading && !!transactionVersions} />
        <AccountTokenTransfersTable
          relatedActivities={relatedActivities || []}
          transactions={transactions || []}
          isLoading={isLoading}
          loadingRowCount={currentLimit}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
          address={address}
          assetType={activeCoin}
          columnFilters={columnFilters}
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

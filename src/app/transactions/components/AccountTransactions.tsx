"use client";

import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import { useGetAccountTransactionVersions } from "@/hooks/accounts/useGetAccountTransactionVersions";
import { useGetAccountTransactionCount } from "@/hooks/accounts/useGetAccountTransactionCount";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
  TransactionTableToolbar,
  TransactionTableFooter,
} from "@/components/transactions";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { ArrowLeft } from "lucide-react";

const MAX_PAGES = 100;

interface AccountTransactionsProps {
  address: string;
  headerEndDecorator?: React.ReactNode;
}

export function AccountTransactions({
  address,
  headerEndDecorator,
}: AccountTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Get page from URL or default to 1, capped at MAX_PAGES
  const pageParam = searchParams.get("page");
  const currentPage = Math.min(
    MAX_PAGES,
    pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1,
  );

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? ((parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE)
    : pageSize;

  // Fetch transaction count
  const { data: txCount } = useGetAccountTransactionCount(address);
  const totalCount = txCount ?? 0;
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(totalCount / currentLimit)),
  );

  // Fetch transaction versions for current page
  const offset = (currentPage - 1) * currentLimit;
  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountTransactionVersions(address, currentLimit, offset);

  // Fetch full transaction details
  const {
    data: fetchedData,
    isLoading: detailsLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "accountTransactionsPagedDetails",
      address,
      network_value,
      currentPage,
      currentLimit,
      transactionVersions,
    ],
    queryFn: async () => {
      if (!transactionVersions || transactionVersions.length === 0) {
        return { transactions: [] };
      }

      const details = await Promise.all(
        transactionVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );

      return { transactions: details };
    },
    enabled: !!transactionVersions && transactionVersions.length > 0,
    placeholderData: keepPreviousData,
  });

  const transactions = fetchedData?.transactions ?? [];
  const isLoading = versionsLoading || (detailsLoading && transactions.length === 0);

  // Transform to table data
  const tableData: TransactionRowData[] = transactions.map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return { version, transaction: tx };
  });

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`/transactions?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
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
          <h1 className="text-xl sm:text-3xl font-bold">
            Account Transactions
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-8">
          <CopyableAddress
            address={address}
            showCopyButton
            variant="muted"
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
          totalCount > 0 ? (
            <>
              <span className="font-medium text-foreground">
                {totalCount.toLocaleString()}
              </span>{" "}
              transactions found
            </>
          ) : undefined
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

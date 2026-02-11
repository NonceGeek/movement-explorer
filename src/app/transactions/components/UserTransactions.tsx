"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useQuery,
  useIsFetching,
  keepPreviousData,
} from "@tanstack/react-query";
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
  TransactionTableToolbar,
  TransactionTableFooter,
} from "@/components/transactions";
import { NewDataNotification } from "@/components/common/NewDataNotification";

const POLL_INTERVAL = 3000;

// Query with limit+1 to determine hasNextPage
const USER_TRANSACTIONS_QUERY = gql`
  query UserTransactions($limit: Int!, $offset: Int!) {
    user_transactions(
      limit: $limit
      offset: $offset
      order_by: { version: desc }
    ) {
      version
    }
  }
`;

const TOP_USER_TRANSACTION_QUERY = gql`
  query TopUserTransaction {
    user_transactions(limit: 1, order_by: { version: desc }) {
      version
    }
  }
`;

interface UserTransactionsQueryResponse {
  user_transactions: {
    version: string;
  }[];
}

interface TopUserTransactionResponse {
  user_transactions: {
    version: string;
  }[];
}

interface UserTransactionsProps {
  headerEndDecorator?: React.ReactNode;
}

export function UserTransactions({
  headerEndDecorator,
}: UserTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();
  const apolloClient = useApolloClient();
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
  const [frozenLatestVersion, setFrozenLatestVersion] = useState<number>(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const isListFetching =
    useIsFetching({
      queryKey: ["userTransactions", "paged", network_value],
    }) > 0;

  // Poll for the latest version to detect new transactions
  const { data: polledLatestVersion } = useQuery({
    queryKey: ["userTransactions", "latest", network_value],
    queryFn: async () => {
      const response = await apolloClient.query<TopUserTransactionResponse>({
        query: TOP_USER_TRANSACTION_QUERY,
        fetchPolicy: "network-only",
      });
      const versions = response.data?.user_transactions || [];
      return versions.length > 0 ? parseInt(versions[0].version) : 0;
    },
    refetchInterval: POLL_INTERVAL,
    enabled: !isListFetching,
  });

  const latestVersionRaw = polledLatestVersion ?? 0;

  // Initialize frozenLatestVersion on first valid load
  useEffect(() => {
    if (frozenLatestVersion === 0 && latestVersionRaw > 0) {
      setFrozenLatestVersion(latestVersionRaw);
    }
  }, [latestVersionRaw, frozenLatestVersion]);

  const hasNewData =
    frozenLatestVersion > 0 && latestVersionRaw > frozenLatestVersion;

  // Fetch transactions for current page
  // Request limit + 1 to determine if there's a next page
  const {
    data: fetchedData,
    isLoading: isTxLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "userTransactions",
      "paged",
      network_value,
      frozenLatestVersion,
      currentPage,
      currentLimit,
    ],
    queryFn: async () => {
      const offset = (currentPage - 1) * currentLimit;
      // Request one extra to check if there's a next page
      const requestLimit = currentLimit + 1;

      // Step 1: Fetch versions via GraphQL
      const response = await apolloClient.query<UserTransactionsQueryResponse>({
        query: USER_TRANSACTIONS_QUERY,
        variables: { limit: requestLimit, offset },
        fetchPolicy: "network-only",
      });

      const allVersions = (response.data?.user_transactions || []).map((t) =>
        parseInt(t.version)
      );

      // Check if there's a next page
      const hasNextPage = allVersions.length > currentLimit;

      // Only use the first currentLimit versions for display
      const versions = allVersions.slice(0, currentLimit);

      if (versions.length === 0) {
        return { transactions: [], hasNextPage: false };
      }

      // Step 2: Fetch full transaction details via Aptos client
      const details = await Promise.all(
        versions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client)
        )
      );

      return { transactions: details, hasNextPage };
    },
    enabled: frozenLatestVersion > 0 || latestVersionRaw > 0,
    placeholderData: keepPreviousData,
  });

  const transactions = fetchedData?.transactions ?? [];
  const hasNextPage = fetchedData?.hasNextPage ?? false;

  const isLoading =
    isTxLoading && (frozenLatestVersion > 0 || latestVersionRaw > 0);

  // Transform to table data
  const tableData: TransactionRowData[] = transactions.map((tx) => {
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
    setFrozenLatestVersion(latestVersionRaw);
    // Reset to page 1 on refresh
    updateURL(1, currentLimit);
  };

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-3xl font-bold">User Transactions</h1>
          <NewDataNotification
            visible={hasNewData}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          />
        </div>
        <div className="self-end sm:self-auto">{headerEndDecorator}</div>
      </div>

      {/* Top Toolbar */}
      <TransactionTableToolbar
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        onPageChange={handlePageChange}
        transactions={tableData}
        isLoading={isLoading}
      />

      {/* Table */}
      <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
        hasNextPage={hasNextPage}
        onPageChange={handlePageChange}
        pageSize={currentLimit}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </>
  );
}

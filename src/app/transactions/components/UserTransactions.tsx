import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  useInfiniteQuery,
  useQuery,
  useIsFetching,
  keepPreviousData,
} from "@tanstack/react-query";
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { NewDataNotification } from "@/components/common/NewDataNotification";
import { Button } from "@movementlabsxyz/movement-design-system";

const LIMIT = 20;
const POLL_INTERVAL = 3000;

const USER_TRANSACTIONS_QUERY = gql`
  query UserTransactions($limit: Int, $start_version: bigint) {
    user_transactions(
      limit: $limit
      order_by: { version: desc }
      where: { version: { _lte: $start_version } }
    ) {
      version
    }
  }
`;

const TOP_USER_TRANSACTIONS_QUERY = gql`
  query UserTransactions($limit: Int) {
    user_transactions(limit: $limit, order_by: { version: desc }) {
      version
    }
  }
`;

interface UserTransactionsQueryResponse {
  user_transactions: {
    version: any;
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

  // Timestamp display mode
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const isListFetching =
    useIsFetching({
      queryKey: ["userTransactions", "infinite", network_value],
    }) > 0;

  // State for manual refresh
  const [frozenLatestVersion, setFrozenLatestVersion] = useState<number>(0);
  // Track initial load to prevent "Refreshing..." on first mount
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Poll for the absolute latest version to detect new transactions
  const { data: polledLatestVersion } = useQuery({
    queryKey: ["userTransactions", "latest", network_value],
    queryFn: async () => {
      const response = await apolloClient.query<UserTransactionsQueryResponse>({
        query: TOP_USER_TRANSACTIONS_QUERY,
        variables: { limit: 1 },
        fetchPolicy: "network-only",
      });
      const versions = (response.data?.user_transactions || []).map(
        (t) => t.version,
      );
      return versions.length > 0 ? parseInt(versions[0]) : 0;
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

  // Use frozen state as the anchor for the list unless it's initial load
  const anchorVersion = frozenLatestVersion > 0 ? frozenLatestVersion : null;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["userTransactions", "infinite", network_value, anchorVersion],
    queryFn: async ({ pageParam }) => {
      // Step 1: Fetch Versions via Apollo
      // If pageParam is null (first page), use anchors.
      // If anchorVersion is set (manual refresh mode), we start from there.
      // If anchorVersion is null (initial), we fetch top.

      let query = TOP_USER_TRANSACTIONS_QUERY;
      let variables: any = { limit: LIMIT };

      if (pageParam !== null) {
        // Subsequent pages
        query = USER_TRANSACTIONS_QUERY;
        variables = { limit: LIMIT, start_version: pageParam };
      } else if (anchorVersion !== null) {
        // First page with manual anchor
        query = USER_TRANSACTIONS_QUERY;
        variables = { limit: LIMIT, start_version: anchorVersion };
      }
      // Else: First page, no anchor yet (initial load) -> TOP_USER_TRANSACTIONS_QUERY

      const response = await apolloClient.query<UserTransactionsQueryResponse>({
        query,
        variables,
        fetchPolicy: "network-only",
      });

      const versions: number[] = (response.data?.user_transactions || []).map(
        (t) => t.version,
      );

      if (versions.length === 0) return [];

      // Step 2: Fetch Details via Aptos Client
      const details = await Promise.all(
        versions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );

      return details;
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < LIMIT) return undefined;
      const lastTx = lastPage[lastPage.length - 1];
      if ("version" in lastTx) {
        return parseInt(lastTx.version) - 1;
      }
      return undefined;
    },
    enabled: true, // Always enabled, logic inside queryFn handles null anchor
    placeholderData: keepPreviousData,
  });

  const hasNewData =
    frozenLatestVersion > 0 && latestVersionRaw > frozenLatestVersion;

  const handleRefresh = () => {
    setFrozenLatestVersion(latestVersionRaw);
  };

  // Flatten data
  const flatTransactions = data?.pages.flatMap((page) => page) ?? [];

  // Transform to TransactionRowData format
  const tableData: TransactionRowData[] = flatTransactions.map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return {
      version,
      transaction: tx,
    };
  });

  // Update isFirstLoad when the query is no longer loading initially
  useEffect(() => {
    if (!isLoading && data) {
      setIsFirstLoad(false);
    }
  }, [isLoading, data]);

  // Only show loading spinner on banner if we are refreshing the main list (fetching first page)
  // and it's NOT the first load (user initiated refresh)
  const isRefreshing = isFetching && !isFetchingNextPage && !isFirstLoad;

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
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

      <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TransactionTable
          data={tableData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={LIMIT}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
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

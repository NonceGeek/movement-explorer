"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@movementlabsxyz/movement-design-system";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useQueries, useQuery } from "@tanstack/react-query";
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import { Types } from "aptos";
import { useIsMobile } from "@/hooks/use-mobile";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";
import { MobileTransactionCardContent } from "./MobileTransactionCard";
import {
  TransactionTable,
  HOME_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { NewDataNotification } from "@/components/common/NewDataNotification";

const POLL_INTERVAL = 3000;

const TOP_USER_TRANSACTIONS_QUERY = gql`
  query LatestUserTransaction($limit: Int) {
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

export interface LatestUserTransactionsProps {
  limit?: number;
}

export function LatestUserTransactions({
  limit = 10,
}: LatestUserTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();
  const apolloClient = useApolloClient();

  // State for manual refresh
  const [frozenLatestVersion, setFrozenLatestVersion] = useState<number>(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Poll for the absolute latest version to detect new transactions
  const { data: polledLatestVersion } = useQuery({
    queryKey: ["homeUserTransactions", "latest", network_value],
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
  });

  const latestVersionRaw = polledLatestVersion ?? 0;

  // Initialize frozenLatestVersion on first valid load
  useEffect(() => {
    if (frozenLatestVersion === 0 && latestVersionRaw > 0) {
      setFrozenLatestVersion(latestVersionRaw);
    }
  }, [latestVersionRaw, frozenLatestVersion]);

  // Fetch versions anchored to frozenLatestVersion (no polling)
  const userTransactionVersions = useGetUserTransactionVersions(
    limit,
    frozenLatestVersion > 0 ? frozenLatestVersion : undefined,
    frozenLatestVersion > 0 ? 0 : undefined,
  );

  // Fetch details for all versions
  const transactionQueries = useQueries({
    queries: userTransactionVersions.map((version) => ({
      queryKey: [
        "transaction",
        { txnHashOrVersion: version.toString() },
        network_value,
      ],
      queryFn: () =>
        getTransaction({ txnHashOrVersion: version.toString() }, aptos_client),
    })),
  });

  const [displayedTransactions, setDisplayedTransactions] = useState<
    {
      version: number;
      data: Types.Transaction;
    }[]
  >([]);

  // Sync data only when all requests are successful
  useEffect(() => {
    const allSuccess = transactionQueries.every((q) => q.isSuccess);

    if (allSuccess && userTransactionVersions.length > 0) {
      const newData = userTransactionVersions.map((version, index) => ({
        version,
        data: transactionQueries[index].data as Types.Transaction,
      }));

      const currentVersions = displayedTransactions
        .map((t) => t.version)
        .join(",");
      const newVersionsStr = newData.map((t) => t.version).join(",");

      if (currentVersions !== newVersionsStr) {
        setDisplayedTransactions(newData);
        setIsManualRefreshing(false);
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      }
    }
  }, [
    transactionQueries,
    userTransactionVersions,
    displayedTransactions,
    isFirstLoad,
  ]);

  const hasNewData =
    frozenLatestVersion > 0 && latestVersionRaw > frozenLatestVersion;

  const handleRefresh = () => {
    setIsManualRefreshing(true);
    setFrozenLatestVersion(latestVersionRaw);
  };

  const isMobile = useIsMobile();
  const isLoading = isFirstLoad && displayedTransactions.length === 0;
  const isRefreshing = isManualRefreshing;

  // Transform to TransactionRowData format
  const tableData: TransactionRowData[] = displayedTransactions.map(
    ({ version, data }) => ({
      version,
      transaction: data,
    }),
  );

  // Mobile loading skeleton
  const MobileLoadingEnhancedSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: limit }).map((_, i) => (
        <EnhancedSkeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  );

  // Mobile view header
  const MobileHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">Time Display</span>
      <TimestampModeToggle mode={timestampMode} setMode={setTimestampMode} />
    </div>
  );

  return (
    <>
      <div className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <h3 className="flex items-center gap-2 text-xl sm:text-2xl font-heading font-semibold">
            Latest User Transactions
          </h3>
          <NewDataNotification
            visible={hasNewData}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          />
        </div>
        <Button
          variant="link"
          asChild
          className="text-guild-green-500 hover:text-guild-green-400 gap-1.5"
        >
          <Link href="/transactions?type=user">
            View All
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
        </Button>
      </div>

      {/* Mobile View */}
      {isMobile ? (
        <div>
          <MobileHeader />
          {isLoading ? (
            <MobileLoadingEnhancedSkeleton />
          ) : (
            <div className="space-y-3">
              {displayedTransactions.map(({ version, data }) => (
                <Link
                  key={version}
                  href={`/txn/${version}`}
                  className="block bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 sm:p-5 transition-all active:scale-[0.98] hover:bg-card/80 hover:border-primary/30 hover:shadow-md"
                >
                  <MobileTransactionCardContent
                    version={version}
                    transactionData={data}
                    timestampMode={timestampMode}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Desktop View - Use TransactionTable */
        <TransactionTable
          data={tableData}
          columns={HOME_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={limit}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
        />
      )}
    </>
  );
}

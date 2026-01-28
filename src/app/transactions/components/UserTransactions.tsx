import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { Types } from "aptos";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { Button } from "@movementlabsxyz/movement-design-system";

const LIMIT = 20;

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

export function UserTransactions() {
  const { aptos_client, network_value } = useGlobalStore();
  const apolloClient = useApolloClient();

  // Timestamp display mode: "age" (default) or "dateTime"
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["userTransactions", "infinite", network_value],
      queryFn: async ({ pageParam }) => {
        // Step 1: Fetch Versions via Apollo
        const query =
          pageParam === null
            ? TOP_USER_TRANSACTIONS_QUERY
            : USER_TRANSACTIONS_QUERY;

        const variables =
          pageParam === null
            ? { limit: LIMIT }
            : { limit: LIMIT, start_version: pageParam };

        const response = await apolloClient.query({
          query,
          variables,
          fetchPolicy: "network-only",
        });

        const versions: number[] = response.data.user_transactions.map(
          (t: { version: any }) => t.version,
        );

        if (versions.length === 0) return [];

        // Step 2: Fetch Details via Aptos Client
        // We fetch details in parallel
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
    });

  // Flatten data
  const flatTransactions = data?.pages.flatMap((page) => page) ?? [];

  // Transform to TransactionRowData format
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

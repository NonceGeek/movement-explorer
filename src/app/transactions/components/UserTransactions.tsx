import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Types } from "aptos";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  TransactionPagination,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";

const LIMIT = 20;
const NUM_PAGES = 100;

export function UserTransactions() {
  const { aptos_client, network_value } = useGlobalStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const offset = (currentPage - 1) * LIMIT;

  // Timestamp display mode: "age" (default) or "dateTime"
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const startVersion = useGetUserTransactionVersions(1)[0];
  const versions = useGetUserTransactionVersions(LIMIT, startVersion, offset);

  // Fetch transaction details for all versions
  const transactionQueries = useQueries({
    queries: versions.map((version) => ({
      queryKey: [
        "transaction",
        { txnHashOrVersion: version.toString() },
        network_value,
      ],
      queryFn: () =>
        getTransaction({ txnHashOrVersion: version.toString() }, aptos_client),
    })),
  });

  const isLoading =
    versions.length === 0 || transactionQueries.some((q) => q.isLoading);
  const allSuccess = transactionQueries.every((q) => q.isSuccess);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "user");
    params.set("page", page.toString());
    router.push(`/transactions?${params.toString()}`);
  };

  // Transform to TransactionRowData format
  const tableData: TransactionRowData[] =
    allSuccess && versions.length > 0
      ? versions.map((version, index) => ({
          version,
          transaction: transactionQueries[index].data as Types.Transaction,
        }))
      : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <TransactionTable
          data={tableData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={false}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
          animationMode="none"
        />
      </div>

      {/* Pagination */}
      <TransactionPagination
        currentPage={currentPage}
        totalPages={NUM_PAGES}
        onPageChange={handlePageChange}
      />
    </>
  );
}

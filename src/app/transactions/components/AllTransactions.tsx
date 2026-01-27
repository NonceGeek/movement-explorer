import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { Loader2 } from "lucide-react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransactions, getLedgerInfo } from "@/services";
import {
  TransactionTable,
  TransactionPagination,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";

const LIMIT = 20;

export function AllTransactions() {
  const { aptos_client, network_value } = useGlobalStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Timestamp display mode: "age" (default) or "dateTime"
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const startParam = searchParams.get("start");

  // Fetch ledger info to get max version
  const { data: ledgerInfo } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
  });

  const maxVersion = ledgerInfo ? parseInt(ledgerInfo.ledger_version) : 0;
  const maxStart = Math.max(0, maxVersion - LIMIT + 1);

  // Calculate start position
  let start = maxStart;
  if (startParam !== null) {
    start = Math.min(Math.max(0, parseInt(startParam)), maxStart);
  }

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", { start, limit: LIMIT }, network_value],
    queryFn: () => getTransactions({ start, limit: LIMIT }, aptos_client),
    enabled: maxVersion > 0,
  });

  // Pagination calculations
  const totalPages = Math.ceil(maxVersion / LIMIT);
  const currentPage = Math.max(1, Math.ceil((maxVersion - start) / LIMIT));

  const handlePageChange = (page: number) => {
    const newStart = Math.max(0, maxVersion - page * LIMIT + 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "all");
    params.set("start", newStart.toString());
    router.push(`/transactions?${params.toString()}`);
  };

  // Transform transactions to TransactionRowData format
  const tableData: TransactionRowData[] = transactions
    ? transactions.map((tx: Types.Transaction) => ({
        version: "version" in tx ? parseInt(tx.version) : 0,
        transaction: tx,
      }))
    : [];

  if (isLoading || !transactions) {
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
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}

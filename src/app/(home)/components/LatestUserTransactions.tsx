"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Clock, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserTransactionRow } from "./UserTransactionRow";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useQueries } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import { Types } from "aptos";

export interface LatestUserTransactionsProps {
  limit?: number;
}

export function LatestUserTransactions({
  limit = 10,
}: LatestUserTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();

  // 1. Fetch versions with polling (3 seconds)
  const userTransactionVersions = useGetUserTransactionVersions(
    limit,
    undefined,
    undefined,
    3000
  );

  // 2. Fetch details for all versions
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

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Timestamp display mode: "age" (default) or "dateTime"
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // 3. Sync data only when all requests are successful
  useEffect(() => {
    const allSuccess = transactionQueries.every((q) => q.isSuccess);

    if (allSuccess && userTransactionVersions.length > 0) {
      const newData = userTransactionVersions.map((version, index) => ({
        version,
        data: transactionQueries[index].data as Types.Transaction,
      }));

      // Check if versions changed to avoid unnecessary re-renders
      const currentVersions = displayedTransactions
        .map((t) => t.version)
        .join(",");
      const newVersions = newData.map((t) => t.version).join(",");

      if (currentVersions !== newVersions) {
        setDisplayedTransactions(newData);
        setIsInitialLoad(false);
      }
    }
  }, [transactionQueries, userTransactionVersions, displayedTransactions]);

  // Loading state is strictly for the FIRST load (when we define it as initial load and no data)
  const isLoading = isInitialLoad && displayedTransactions.length === 0;

  return (
    <Card variant="glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl font-heading">
          <ArrowLeftRight size={20} className="text-moveus-marigold-500" />
          Latest User Transactions
        </CardTitle>
        <Link
          href="/transactions?type=user"
          className="text-sm font-medium text-moveus-marigold-500 hover:text-moveus-marigold-400 bg-moveus-marigold-500/10 hover:bg-moveus-marigold-500/20 px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5"
        >
          View All
          <ArrowRight size={14} />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>
                  <button
                    onClick={() =>
                      setTimestampMode((prev) =>
                        prev === "age" ? "dateTime" : "age"
                      )
                    }
                    className="flex items-center transition-colors"
                  >
                    <span
                      className={
                        timestampMode === "age"
                          ? "text-foreground"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                      }
                    >
                      Age
                    </span>
                    <span className="text-muted-foreground/30 mx-1.5">/</span>
                    <span
                      className={
                        timestampMode === "dateTime"
                          ? "text-foreground"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                      }
                    >
                      UTC
                    </span>
                  </button>
                </TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Function</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : displayedTransactions.map(({ version, data }) => (
                    <UserTransactionRow
                      key={version}
                      version={version}
                      transactionData={data}
                      timestampMode={timestampMode}
                      className="animate-in slide-in-from-top-2 fade-in duration-500"
                    />
                  ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

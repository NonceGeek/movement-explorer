"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { Button } from "@movementlabsxyz/movement-design-system";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MobileTransactionCard } from "./MobileTransactionCard";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useQueries } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import { Types } from "aptos";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Check if mobile
  const isMobile = useIsMobile();

  // Loading state is strictly for the FIRST load (when we define it as initial load and no data)
  const isLoading = isInitialLoad && displayedTransactions.length === 0;

  // Mobile loading skeleton
  const MobileLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: limit }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  );

  // Mobile view header with Age/UTC toggle
  const MobileHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">Time Display</span>
      <div className="inline-flex items-center bg-muted/30 rounded-md p-0.5 border border-border/50">
        <button
          onClick={() => setTimestampMode("age")}
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            timestampMode === "age"
              ? "bg-guild-green-500 text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Age
        </button>
        <button
          onClick={() => setTimestampMode("dateTime")}
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            timestampMode === "dateTime"
              ? "bg-guild-green-500 text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          UTC
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-row items-center justify-between py-4">
        <h3 className="flex items-center gap-2 text-base sm:text-xl font-heading font-semibold">
          <ArrowLeftRight size={20} className="text-moveus-marigold-500" />
          Latest User Transactions
        </h3>
        <Button
          variant="link"
          asChild
          className="text-moveus-marigold-500 hover:text-moveus-marigold-400 gap-1.5"
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
            <MobileLoadingSkeleton />
          ) : (
            <div className="space-y-3">
              {displayedTransactions.map(({ version, data }) => (
                <MobileTransactionCard
                  key={version}
                  version={version}
                  transactionData={data}
                  timestampMode={timestampMode}
                  className="animate-in slide-in-from-top-2 fade-in duration-500"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Desktop View */
        <Table className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-0!">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="text-muted-foreground font-normal">
                Transaction Hash
              </TableHead>
              <TableHead className="text-muted-foreground font-normal">
                <div className="inline-flex items-center bg-muted/30 rounded-md p-0.5 border border-border/50">
                  <button
                    onClick={() => setTimestampMode("age")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      timestampMode === "age"
                        ? "bg-guild-green-500 text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Age
                  </button>
                  <button
                    onClick={() => setTimestampMode("dateTime")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      timestampMode === "dateTime"
                        ? "bg-guild-green-500 text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    UTC
                  </button>
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-normal">
                Sender
              </TableHead>
              <TableHead className="text-muted-foreground font-normal hidden md:table-cell">
                Receiver
              </TableHead>
              <TableHead className="text-muted-foreground font-normal hidden sm:table-cell">
                Function
              </TableHead>
              <TableHead className="text-muted-foreground font-normal hidden lg:table-cell text-right">
                Amount
              </TableHead>
              <TableHead className="text-muted-foreground font-normal hidden lg:table-cell text-right">
                Gas
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
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
      )}
    </>
  );
}

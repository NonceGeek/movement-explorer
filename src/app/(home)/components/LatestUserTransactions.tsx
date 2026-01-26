"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@movementlabsxyz/movement-design-system";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { UserTransactionRowCells } from "./UserTransactionRow";
import { MobileTransactionCardContent } from "./MobileTransactionCard";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useQueries } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import { Types } from "aptos";
import { useIsMobile } from "@/hooks/use-mobile";

// Animation variants for initial load (stagger effect)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Slower stagger
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,  // Lower = slower, more relaxed
      damping: 20,     // Smooth deceleration
      mass: 0.8,       // Lighter feel
    },
  },
};

// Animation container for updates (with stagger for new items)
const updateContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06, // Slower stagger for updates
    },
  },
};

// Animation for new items entering during updates
// Uses custom prop to calculate stagger delay based on position
const updateItemVariants: Variants = {
  initial: { opacity: 0, y: -24, scale: 0.96 },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,   // Slower spring
      damping: 22,      // Smooth landing
      mass: 0.8,
      delay: custom * 0.06, // Slower stagger
    },
  }),
  exit: {
    opacity: 0,
    x: -30,
    transition: {
      duration: 0.3,    // Slower exit
      ease: "easeOut",
    },
  },
};

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
    3000,
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
  // Track if initial animation has completed
  const hasAnimatedInitial = useRef(false);

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
        // Mark initial load as complete after first data arrives
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    }
  }, [transactionQueries, userTransactionVersions, displayedTransactions, isInitialLoad]);

  // Mark initial animation as complete after a delay
  useEffect(() => {
    if (!isInitialLoad && displayedTransactions.length > 0 && !hasAnimatedInitial.current) {
      const timer = setTimeout(() => {
        hasAnimatedInitial.current = true;
      }, 600); // Wait for stagger animation to complete
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, displayedTransactions.length]);

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
          Latest User Transactions
        </h3>
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
            <MobileLoadingSkeleton />
          ) : !hasAnimatedInitial.current ? (
            // Initial load animation with stagger
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {displayedTransactions.map(({ version, data }) => (
                <motion.div key={version} variants={itemVariants}>
                  <Link
                    href={`/txn/${version}`}
                    className="block bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-3 sm:p-4 transition-all active:scale-[0.98] hover:bg-card/80 hover:border-primary/30 hover:shadow-md"
                  >
                    <MobileTransactionCardContent
                      version={version}
                      transactionData={data}
                      timestampMode={timestampMode}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Update animation with layout and stagger
            <motion.div
              className="space-y-3"
              variants={updateContainerVariants}
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {displayedTransactions.map(({ version, data }, index) => (
                  <motion.div
                    key={version}
                    layout
                    custom={index}
                    variants={updateItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      layout: { type: "spring", stiffness: 200, damping: 25 },
                    }}
                  >
                    <Link
                      href={`/txn/${version}`}
                      className="block bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-3 sm:p-4 transition-all active:scale-[0.98] hover:bg-card/80 hover:border-primary/30 hover:shadow-md"
                    >
                      <MobileTransactionCardContent
                        version={version}
                        transactionData={data}
                        timestampMode={timestampMode}
                      />
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      ) : (
        /* Desktop View */
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead>Transaction Hash</StyledTableHead>
              <StyledTableHead>
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
              </StyledTableHead>
              <StyledTableHead>Sender</StyledTableHead>
              <StyledTableHead className="hidden md:table-cell">
                To
              </StyledTableHead>
              <StyledTableHead className="hidden sm:table-cell">
                Function
              </StyledTableHead>
              <StyledTableHead className="hidden lg:table-cell text-right">
                Amount
              </StyledTableHead>
              <StyledTableHead className="hidden lg:table-cell text-right">
                Gas
              </StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !hasAnimatedInitial.current ? (
            // Initial load animation with stagger
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {displayedTransactions.map(({ version, data }) => (
                <motion.tr
                  key={version}
                  variants={itemVariants}
                  className="hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-14"
                >
                  <UserTransactionRowCells
                    version={version}
                    transactionData={data}
                    timestampMode={timestampMode}
                  />
                </motion.tr>
              ))}
            </motion.tbody>
          ) : (
            // Update animation with layout and stagger
            <motion.tbody
              variants={updateContainerVariants}
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {displayedTransactions.map(({ version, data }, index) => (
                  <motion.tr
                    key={version}
                    layout
                    custom={index}
                    variants={updateItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      layout: { type: "spring", stiffness: 200, damping: 25 },
                    }}
                    className="hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-14"
                  >
                    <UserTransactionRowCells
                      version={version}
                      transactionData={data}
                      timestampMode={timestampMode}
                    />
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          )}
        </StyledTable>
      )}
    </>
  );
}

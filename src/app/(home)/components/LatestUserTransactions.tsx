"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@movementlabsxyz/movement-design-system";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useQueries } from "@tanstack/react-query";
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

// Animation variants for mobile view
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const updateContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const updateItemVariants: Variants = {
  initial: { opacity: 0, y: -24, scale: 0.96 },
  animate: (custom: { index: number; isNew: boolean }) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 22,
      mass: 0.8,
      delay: custom.index * 0.06,
    },
  }),
  exit: {
    opacity: 0,
    x: -30,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const highlightVariants: Variants = {
  initial: {
    backgroundColor: "rgba(0, 255, 127, 0.15)",
    boxShadow: "inset 0 0 0 1px rgba(0, 255, 127, 0.3)",
  },
  animate: {
    backgroundColor: "rgba(0, 255, 127, 0)",
    boxShadow: "inset 0 0 0 1px rgba(0, 255, 127, 0)",
    transition: {
      duration: 2,
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
  const [hasAnimatedInitial, setHasAnimatedInitial] = useState(false);
  const [highlightedVersions, setHighlightedVersions] = useState<Set<number>>(
    new Set(),
  );
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // 3. Sync data only when all requests are successful
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
        if (hasAnimatedInitial) {
          const currentVersionSet = new Set(
            displayedTransactions.map((t) => t.version),
          );
          const newlyAdded = newData
            .filter((t) => !currentVersionSet.has(t.version))
            .map((t) => t.version);

          if (newlyAdded.length > 0) {
            setHighlightedVersions(new Set(newlyAdded));
          }
        }

        setDisplayedTransactions(newData);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    }
  }, [
    transactionQueries,
    userTransactionVersions,
    displayedTransactions,
    isInitialLoad,
    hasAnimatedInitial,
  ]);

  // Clear highlight after animation completes
  useEffect(() => {
    if (highlightedVersions.size > 0) {
      const timer = setTimeout(() => {
        setHighlightedVersions(new Set());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedVersions]);

  // Mark initial animation as complete
  useEffect(() => {
    if (
      !isInitialLoad &&
      displayedTransactions.length > 0 &&
      !hasAnimatedInitial
    ) {
      const timer = setTimeout(() => {
        setHasAnimatedInitial(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, displayedTransactions.length, hasAnimatedInitial]);

  const isMobile = useIsMobile();
  const isLoading = isInitialLoad && displayedTransactions.length === 0;

  // Transform to TransactionRowData format
  const tableData: TransactionRowData[] = displayedTransactions.map(
    ({ version, data }) => ({
      version,
      transaction: data,
      isHighlighted: highlightedVersions.has(version),
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
        <h3 className="flex items-center gap-2 text-xl sm:text-2xl font-heading font-semibold">
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
            <MobileLoadingEnhancedSkeleton />
          ) : (
            <motion.div
              className="space-y-3"
              variants={
                !hasAnimatedInitial
                  ? containerVariants
                  : updateContainerVariants
              }
              initial={!hasAnimatedInitial ? "hidden" : false}
              animate={!hasAnimatedInitial ? "show" : "animate"}
            >
              <AnimatePresence mode="popLayout">
                {displayedTransactions.map(({ version, data }, index) => {
                  const isNew = highlightedVersions.has(version);
                  return (
                    <motion.div
                      key={version}
                      layout={hasAnimatedInitial}
                      custom={{ index, isNew }}
                      variants={
                        !hasAnimatedInitial ? itemVariants : updateItemVariants
                      }
                      initial={
                        !hasAnimatedInitial
                          ? "hidden"
                          : isNew
                            ? "initial"
                            : false
                      }
                      animate={!hasAnimatedInitial ? "show" : "animate"}
                      exit="exit"
                      transition={{
                        layout: { type: "spring", stiffness: 200, damping: 25 },
                      }}
                      className="relative"
                    >
                      {isNew && (
                        <motion.div
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          variants={highlightVariants}
                          initial="initial"
                          animate="animate"
                        />
                      )}
                      <Link
                        href={`/txn/${version}`}
                        className="block bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 sm:p-5 transition-all active:scale-[0.98] hover:bg-card/80 hover:border-primary/30 hover:shadow-md"
                      >
                        <MobileTransactionCardContent
                          version={version}
                          transactionData={data}
                          timestampMode={timestampMode}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
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
          animationMode="realtime"
          highlightedVersions={highlightedVersions}
          hasAnimatedInitial={hasAnimatedInitial}
        />
      )}
    </>
  );
}

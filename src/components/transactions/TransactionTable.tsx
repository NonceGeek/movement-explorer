"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  StyledTable,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { TransactionTableProps, TransactionRowData } from "./types";
import { TransactionTableHeader } from "./TransactionTableHeader";
import {
  TransactionTableRow,
  TransactionTableRowCells,
} from "./TransactionTableRow";
import { getColumnCount } from "./columnPresets";

// Animation variants for initial load (stagger effect)
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

// Animation container for updates
const updateContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

/**
 * Unified Transaction Table Component
 *
 * Supports three animation modes:
 * - "none": No animations, static table
 * - "stagger": Initial load stagger animation only
 * - "realtime": Full animation with new item highlights (for polling updates)
 */
export function TransactionTable({
  data,
  columns,
  isLoading = false,
  loadingRowCount = 10,
  timestampMode,
  onToggleTimestampMode,
  animationMode = "none",
  highlightedVersions = new Set(),
  hasAnimatedInitial = true,
}: TransactionTableProps) {
  const columnCount = getColumnCount(columns);

  // Track known versions to detect newly loaded items (for Load More animation)
  const knownVersionsRef = useRef<Set<number>>(new Set());

  // Compute which versions are newly added (not in the previous render)
  const newlyAddedVersions = useMemo(() => {
    const currentVersions = data.map((d) => d.version);
    const newVersions = new Set<number>();

    // Only compute if we have some known versions (skip initial load)
    if (knownVersionsRef.current.size > 0) {
      for (const version of currentVersions) {
        if (!knownVersionsRef.current.has(version)) {
          newVersions.add(version);
        }
      }
    }

    return newVersions;
  }, [data]);

  // Update known versions after render
  useEffect(() => {
    const currentVersions = data.map((d) => d.version);
    knownVersionsRef.current = new Set(currentVersions);
  }, [data]);

  // Loading skeleton
  if (isLoading) {
    return (
      <StyledTable>
        <TransactionTableHeader
          columns={columns}
          timestampMode={timestampMode}
          onToggleTimestampMode={onToggleTimestampMode}
        />
        <TableBody>
          {Array.from({ length: loadingRowCount }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={columnCount}>
                <EnhancedSkeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    );
  }

  // No animation mode - simple static table
  if (animationMode === "none") {
    return (
      <StyledTable>
        <TransactionTableHeader
          columns={columns}
          timestampMode={timestampMode}
          onToggleTimestampMode={onToggleTimestampMode}
        />
        <TableBody>
          {data.map(({ version, transaction }) => (
            <TransactionTableRow
              key={version}
              version={version}
              transaction={transaction}
              columns={columns}
              timestampMode={timestampMode}
              onToggleTimestampMode={onToggleTimestampMode}
              className="animate-in slide-in-from-top-2 fade-in duration-500"
            />
          ))}
        </TableBody>
      </StyledTable>
    );
  }

  // Animated mode (stagger or realtime)
  return (
    <StyledTable>
      <TransactionTableHeader
        columns={columns}
        timestampMode={timestampMode}
        onToggleTimestampMode={onToggleTimestampMode}
      />
      <motion.tbody
        variants={
          !hasAnimatedInitial ? containerVariants : updateContainerVariants
        }
        initial={!hasAnimatedInitial ? "hidden" : false}
        animate={!hasAnimatedInitial ? "show" : "animate"}
      >
        <AnimatePresence mode="popLayout">
          {data.map(({ version, transaction }, index) => {
            // isNew: highlighted versions from manual refresh
            // isNewlyLoaded: versions from Load More
            const isNew = highlightedVersions.has(version);
            const isNewlyLoaded = newlyAddedVersions.has(version);
            const shouldAnimate = isNew || isNewlyLoaded;
            return (
              <motion.tr
                key={version}
                layout={hasAnimatedInitial}
                custom={{ index, isNew: shouldAnimate }}
                variants={!hasAnimatedInitial ? itemVariants : undefined}
                initial={
                  !hasAnimatedInitial
                    ? "hidden"
                    : shouldAnimate
                      ? {
                        opacity: 0,
                        y: 24,
                        scale: 0.96,
                        backgroundColor: "rgba(0, 255, 127, 0.12)",
                      }
                      : false
                }
                animate={
                  !hasAnimatedInitial
                    ? "show"
                    : {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      backgroundColor: "rgba(0, 0, 0, 0)",
                      transitionEnd: { backgroundColor: "" },
                    }
                }
                exit={{
                  opacity: 0,
                  x: -30,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                transition={{
                  layout: { type: "spring", stiffness: 200, damping: 25 },
                  type: "spring",
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  delay: shouldAnimate ? index * 0.03 : 0,
                  backgroundColor: { duration: 2, ease: "easeOut" },
                }}
                className="hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-16"
              >
                <TransactionTableRowCells
                  version={version}
                  transaction={transaction}
                  columns={columns}
                  timestampMode={timestampMode}
                  onToggleTimestampMode={onToggleTimestampMode}
                />
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </motion.tbody>
    </StyledTable>
  );
}

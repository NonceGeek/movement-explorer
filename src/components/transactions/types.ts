import { Types } from "aptos";
import { ReactNode } from "react";

/**
 * Transaction Table Type Definitions
 * Unified types for the reusable TransactionTable component system
 */

// Available column keys
export type TransactionColumnKey =
  | "hash"
  | "type"
  | "timestamp"
  | "sender"
  | "to"
  | "function"
  | "amount"
  | "gas";

// Column configuration
export interface TransactionColumnConfig {
  key: TransactionColumnKey;
  label: string | ReactNode;
  hideAt?: "sm" | "md" | "lg"; // Responsive breakpoint to hide column
  align?: "left" | "right" | "center";
  width?: string; // e.g., 'w-[300px]'
}

// Unified row data
export interface TransactionRowData {
  version: number;
  transaction: Types.Transaction;
  isHighlighted?: boolean;
}

// Animation mode for table
export type TableAnimationMode = "none" | "stagger" | "realtime";

// Main table props
export interface TransactionTableProps {
  data: TransactionRowData[];
  columns: TransactionColumnConfig[];
  isLoading?: boolean;
  loadingRowCount?: number;
  // Timestamp
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: () => void;
  // Animation (for home page)
  animationMode?: TableAnimationMode;
  highlightedVersions?: Set<number>;
  hasAnimatedInitial?: boolean;
  // Callbacks
  onAnimationComplete?: () => void;
}

// Row props
export interface TransactionTableRowProps {
  transaction: Types.Transaction;
  version: number;
  columns: TransactionColumnConfig[];
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode?: () => void;
  className?: string;
  isHighlighted?: boolean;
}

// Pagination props
export interface TransactionPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

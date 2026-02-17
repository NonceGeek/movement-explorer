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
  | "direction"
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
}

// Main table props
export interface TransactionTableProps {
  data: TransactionRowData[];
  columns: TransactionColumnConfig[];
  isLoading?: boolean;
  loadingRowCount?: number;
  // Timestamp
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: () => void;
  /** Current account address — used for direction labels (IN/OUT/Contract) */
  address?: string;
}

// Row props
export interface TransactionTableRowProps {
  transaction: Types.Transaction;
  version: number;
  columns: TransactionColumnConfig[];
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode?: () => void;
  className?: string;
  /** Current account address — used for direction labels */
  address?: string;
}

// Pagination props (legacy)
export interface TransactionPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Table pagination props
export interface TablePaginationProps {
  currentPage: number;
  totalPages?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
  className?: string;
  disabled?: boolean;
}

// Page size selector props
export interface PageSizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
  className?: string;
  disabled?: boolean;
}

// Download page data props
export interface DownloadPageDataProps {
  transactions: TransactionRowData[];
  disabled?: boolean;
  className?: string;
}

// Transaction table toolbar props
export interface TransactionTableToolbarProps {
  currentPage: number;
  totalPages?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  transactions: TransactionRowData[];
  isLoading?: boolean;
  className?: string;
}

// Transaction table footer props
export interface TransactionTableFooterProps {
  currentPage: number;
  totalPages?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  className?: string;
}

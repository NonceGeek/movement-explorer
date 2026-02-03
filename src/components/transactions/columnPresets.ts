import { TransactionColumnConfig } from "./types";

/**
 * Column presets for different transaction table contexts
 */

// Base columns shared between all transaction tables
const BASE_COLUMNS: TransactionColumnConfig[] = [
  { key: "hash", label: "Transaction Hash" },
  { key: "function", label: "Function", width: "w-[300px]" },
  { key: "timestamp", label: "Age" },
  { key: "sender", label: "Sender" },
  { key: "to", label: "To" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "gas", label: "Gas", align: "right" },
];

/**
 * Home page transaction table columns (7 columns, no Type)
 * Used by: LatestUserTransactions
 */
export const HOME_TRANSACTION_COLUMNS: TransactionColumnConfig[] = BASE_COLUMNS;

/**
 * Transactions page columns (8 columns, includes Type)
 * Used by: AllTransactions, UserTransactions
 */
export const ALL_TRANSACTION_COLUMNS: TransactionColumnConfig[] = [
  { key: "hash", label: "Transaction Hash" },
  { key: "function", label: "Function", width: "w-[300px]" },
  { key: "type", label: "Type", align: "left" },
  { key: "timestamp", label: "Age" },
  { key: "sender", label: "Sender" },
  { key: "to", label: "To" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "gas", label: "Gas", align: "right" },
];

/**
 * Get column count for a preset
 */
export function getColumnCount(columns: TransactionColumnConfig[]): number {
  return columns.length;
}

/**
 * Check if a column is present in the preset
 */
export function hasColumn(
  columns: TransactionColumnConfig[],
  key: TransactionColumnConfig["key"],
): boolean {
  return columns.some((col) => col.key === key);
}

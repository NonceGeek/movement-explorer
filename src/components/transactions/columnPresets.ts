import { TransactionColumnConfig } from "./types";

/**
 * Column presets for different transaction table contexts
 */

// Base columns shared between all transaction tables
const BASE_COLUMNS: TransactionColumnConfig[] = [
  { key: "hash", label: "Transaction Hash", width: "w-[170px]" },
  { key: "function", label: "Function", width: "w-[120px]" },
  { key: "timestamp", label: "Age", width: "w-[155px]" },
  { key: "sender", label: "Sender", width: "w-[145px]" },
  { key: "to", label: "To", width: "w-[150px]" },
  { key: "amount", label: "Amount", align: "right", width: "w-[150px]" },
  { key: "gas", label: "Gas", align: "right", width: "w-[150px]" },
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
  { key: "hash", label: "Transaction Hash", width: "w-[170px]" },
  { key: "function", label: "Function", width: "w-[120px]" },
  { key: "timestamp", label: "Age", width: "w-[155px]" },
  { key: "sender", label: "Sender", width: "w-[145px]" },
  { key: "to", label: "To", width: "w-[150px]" },
  { key: "amount", label: "Amount", align: "right", width: "w-[130px]" },
  { key: "gas", label: "Gas", align: "right", width: "w-[100px]" },
];

/**
 * Account page transaction table columns (includes direction label)
 * Used by: Account TransactionsTab
 */
export const ACCOUNT_TRANSACTION_COLUMNS: TransactionColumnConfig[] = [
  { key: "hash", label: "Transaction Hash", width: "w-[170px]" },
  { key: "function", label: "Function", width: "w-[120px]" },
  { key: "timestamp", label: "Age", width: "w-[155px]" },
  { key: "sender", label: "Sender", width: "w-[145px]" },
  { key: "direction", label: "", width: "w-[60px]" },
  { key: "to", label: "To", width: "w-[150px]" },
  { key: "amount", label: "Amount", align: "right", width: "w-[130px]" },
  { key: "gas", label: "Gas", align: "right", width: "w-[100px]" },
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

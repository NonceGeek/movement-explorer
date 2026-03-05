import { Types } from "aptos";
import {
  getTransactionSender,
  getTransactionFunction,
  getTransactionAmount,
  getTransactionCounterparty,
  formatMoveAmount,
} from "@/utils/transaction";

/**
 * Generate a CSV string from transaction data.
 *
 * Columns: Transaction Hash, Function, Timestamp, Sender, To,
 *          Amount (MOVE), Gas Fee (MOVE)
 */
function generateCSV(
  transactions: { version: number; transaction: Types.Transaction }[],
): string {
  const headers = [
    "Transaction Hash",
    "Function",
    "Timestamp",
    "Sender",
    "To",
    "Amount (MOVE)",
    "Gas Fee (MOVE)",
  ];

  const rows = transactions.map(({ transaction }) => {
    const sender = getTransactionSender(transaction) ?? "";
    const fn = getTransactionFunction(transaction) ?? "";

    const timestamp =
      "timestamp" in transaction
        ? new Date(parseInt(transaction.timestamp) / 1000).toISOString()
        : "";

    const counterparty = getTransactionCounterparty(transaction);
    const to = counterparty?.address ?? "";

    const amount = getTransactionAmount(transaction);
    const amountStr =
      amount !== undefined && amount > 0 ? formatMoveAmount(amount) : "0";

    const gasUsed = "gas_used" in transaction ? transaction.gas_used : "0";
    const gasPrice =
      "gas_unit_price" in transaction ? transaction.gas_unit_price : "0";
    const gasFee = formatMoveAmount(BigInt(gasUsed) * BigInt(gasPrice));

    return [
      "hash" in transaction ? transaction.hash : "",
      fn,
      timestamp,
      sender,
      to,
      amountStr,
      gasFee,
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Trigger browser download of a file via the Blob API.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download transactions as a CSV file.
 *
 * The exported CSV contains columns for Transaction Hash, Function,
 * Timestamp, Sender, To, Amount (MOVE), and Gas Fee (MOVE).
 */
export function downloadTransactionsAsCSV(
  transactions: { version: number; transaction: Types.Transaction }[],
  filename?: string,
): void {
  if (transactions.length === 0) return;

  const csv = generateCSV(transactions);
  const defaultFilename = `transactions-${new Date().toISOString().split("T")[0]}.csv`;

  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}

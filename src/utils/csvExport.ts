import { Types } from "aptos";

interface TransactionCSVRow {
  txnHash: string;
  version: string;
  type: string;
  timestamp: string;
  sender: string;
  function: string;
  gasUsed: string;
  gasUnitPrice: string;
  status: string;
}

/**
 * Extract transaction data for CSV export
 */
function extractTransactionData(
  tx: Types.Transaction,
  version: number
): TransactionCSVRow {
  const isUserTx = "sender" in tx;
  const timestamp =
    "timestamp" in tx ? new Date(Number(tx.timestamp) / 1000).toISOString() : "";

  let functionName = "";
  if (isUserTx && "payload" in tx) {
    const payload = tx.payload;
    if ("function" in payload) {
      functionName = payload.function;
    } else if ("type" in payload) {
      functionName = payload.type;
    }
  }

  return {
    txnHash: "hash" in tx ? tx.hash : "",
    version: version.toString(),
    type: tx.type,
    timestamp,
    sender: isUserTx ? tx.sender : "",
    function: functionName,
    gasUsed: "gas_used" in tx ? tx.gas_used : "",
    gasUnitPrice: isUserTx ? tx.gas_unit_price : "",
    status: "success" in tx ? (tx.success ? "Success" : "Failed") : "",
  };
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: TransactionCSVRow[]): string {
  if (data.length === 0) return "";

  const headers = [
    "Txn Hash",
    "Version",
    "Type",
    "Timestamp (UTC)",
    "Sender",
    "Function",
    "Gas Used",
    "Gas Unit Price",
    "Status",
  ];

  const rows = data.map((row) =>
    [
      row.txnHash,
      row.version,
      row.type,
      row.timestamp,
      row.sender,
      row.function,
      row.gasUsed,
      row.gasUnitPrice,
      row.status,
    ]
      .map((value) => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = value.replace(/"/g, '""');
        return /[,"\n]/.test(value) ? `"${escaped}"` : escaped;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Trigger browser download of a file
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
 * Download transactions as CSV file
 */
export function downloadTransactionsAsCSV(
  transactions: { version: number; transaction: Types.Transaction }[],
  filename?: string
): void {
  const csvData = transactions.map(({ version, transaction }) =>
    extractTransactionData(transaction, version)
  );

  const csv = arrayToCSV(csvData);
  const defaultFilename = `transactions-${new Date().toISOString().split("T")[0]}.csv`;

  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}

import { Types } from "aptos";

interface BlockCSVRow {
  blockHeight: string;
  blockHash: string;
  timestamp: string;
  transactionCount: string;
  firstVersion: string;
  lastVersion: string;
}

/**
 * Extract block data for CSV export
 */
function extractBlockData(block: Types.Block): BlockCSVRow {
  const txCount = (
    BigInt(block.last_version) -
    BigInt(block.first_version) +
    BigInt(1)
  ).toString();

  return {
    blockHeight: block.block_height,
    blockHash: block.block_hash,
    timestamp: new Date(Number(block.block_timestamp) / 1000).toISOString(),
    transactionCount: txCount,
    firstVersion: block.first_version,
    lastVersion: block.last_version,
  };
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: BlockCSVRow[]): string {
  if (data.length === 0) return "";

  const headers = [
    "Block Height",
    "Block Hash",
    "Timestamp (UTC)",
    "Transactions",
    "First Version",
    "Last Version",
  ];

  const rows = data.map((row) =>
    [
      row.blockHeight,
      row.blockHash,
      row.timestamp,
      row.transactionCount,
      row.firstVersion,
      row.lastVersion,
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
 * Download blocks as CSV file
 */
export function downloadBlocksAsCSV(
  blocks: { blockHeight: number; block: Types.Block }[],
  filename?: string
): void {
  const csvData = blocks.map(({ block }) => extractBlockData(block));

  const csv = arrayToCSV(csvData);
  const defaultFilename = `blocks-${new Date().toISOString().split("T")[0]}.csv`;

  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}

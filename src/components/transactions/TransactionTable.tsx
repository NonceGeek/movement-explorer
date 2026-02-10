"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  StyledTable,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { TransactionTableProps } from "./types";
import { TransactionTableHeader } from "./TransactionTableHeader";
import { TransactionTableRow } from "./TransactionTableRow";
import { getColumnCount } from "./columnPresets";

/**
 * Unified Transaction Table Component
 *
 * Renders a static table with CSS slide-in + fade-in animation for rows.
 */
export function TransactionTable({
  data,
  columns,
  isLoading = false,
  loadingRowCount = 10,
  timestampMode,
  onToggleTimestampMode,
}: TransactionTableProps) {
  const columnCount = getColumnCount(columns);

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
            <TableRow key={i} className="h-16">
              <TableCell colSpan={columnCount}>
                <EnhancedSkeleton className="h-13 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    );
  }

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

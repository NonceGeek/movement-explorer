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
  address,
  columnFilters,
}: TransactionTableProps) {

  // Loading skeleton
  if (isLoading) {
    return (
      <StyledTable>
        <TransactionTableHeader
          columns={columns}
          timestampMode={timestampMode}
          onToggleTimestampMode={onToggleTimestampMode}
          columnFilters={columnFilters}
        />
        <TableBody>
          {Array.from({ length: loadingRowCount }).map((_, i) => (
            <TableRow key={i} className="h-16">
              {columns.map((col) => (
                <TableCell key={col.key} className={col.width || ""}>
                  <EnhancedSkeleton className="h-8 w-full" />
                </TableCell>
              ))}
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
        columnFilters={columnFilters}
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
            address={address}
            className="animate-in slide-in-from-top-2 fade-in duration-500"
          />
        ))}
      </TableBody>
    </StyledTable>
  );
}

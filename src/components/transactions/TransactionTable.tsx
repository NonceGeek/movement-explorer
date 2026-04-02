"use client";

import { SearchX } from "lucide-react";
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
 * Supports streaming mode: rows with transaction=null render as skeletons.
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
        {data.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-40">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-3 bg-muted/30 rounded-full">
                  <SearchX className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/70">No matching results</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Try adjusting or clearing your filters</p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map(({ version, transaction }) =>
            transaction ? (
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
            ) : (
              <TableRow key={version} className="h-16">
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.width || ""}>
                    <EnhancedSkeleton className="h-8 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ),
          )
        )}
      </TableBody>
    </StyledTable>
  );
}

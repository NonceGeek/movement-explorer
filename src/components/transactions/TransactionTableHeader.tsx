"use client";

import {
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
} from "@/components/ui/table";
import { TransactionTypeTooltip } from "@/components/common/TransactionTypeTooltip";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";
import { TransactionColumnConfig } from "./types";
import { cn } from "@/utils/styling";

interface TransactionTableHeaderProps {
  columns: TransactionColumnConfig[];
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: (mode: "age" | "dateTime") => void;
}

/**
 * Reusable transaction table header component
 * Renders header cells based on column configuration
 */
export function TransactionTableHeader({
  columns,
  timestampMode,
  onToggleTimestampMode,
}: TransactionTableHeaderProps) {
  // Get responsive class for column hiding
  const getHideClass = (hideAt?: "sm" | "md" | "lg") => {
    if (!hideAt) return "";
    return `hidden ${hideAt}:table-cell`;
  };

  // Render individual header cell based on column key
  const renderHeaderCell = (column: TransactionColumnConfig) => {
    const hideClass = getHideClass(column.hideAt);
    const alignClass = column.align === "right" ? "text-right" : "";

    switch (column.key) {
      case "type":
        return (
          <StyledTableHead key={column.key} className="flex items-center">
            Type
            <TransactionTypeTooltip />
          </StyledTableHead>
        );

      case "timestamp":
        return (
          <StyledTableHead key={column.key}>
            <TimestampModeToggle
              mode={timestampMode}
              setMode={onToggleTimestampMode}
            />
          </StyledTableHead>
        );

      default:
        return (
          <StyledTableHead
            key={column.key}
            className={cn(hideClass, alignClass)}
          >
            {column.label}
          </StyledTableHead>
        );
    }
  };

  return (
    <StyledTableHeader>
      <StyledTableHeaderRow>
        {columns.map((column) => renderHeaderCell(column))}
      </StyledTableHeaderRow>
    </StyledTableHeader>
  );
}

"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * StyledTable - A pre-styled table variant with card-like appearance
 * Features: semi-transparent background, backdrop blur, rounded corners, subtle border
 */
const StyledTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <Table
    ref={ref}
    className={cn(
      "bg-card/50 backdrop-blur-sm rounded-xl border border-border/50",
      className,
    )}
    {...props}
  />
));
StyledTable.displayName = "StyledTable";

/**
 * StyledTableHeader - A pre-styled table header with muted background
 */
const StyledTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <TableHeader ref={ref} className={cn("bg-muted/30", className)} {...props} />
));
StyledTableHeader.displayName = "StyledTableHeader";

/**
 * StyledTableHeaderRow - A pre-styled header row without hover effect and border
 */
const StyledTableHeaderRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <TableRow
    ref={ref}
    className={cn("hover:bg-transparent border-0", className)}
    {...props}
  />
));
StyledTableHeaderRow.displayName = "StyledTableHeaderRow";

/**
 * StyledTableHead - A pre-styled table head cell with muted text and normal font weight
 */
const StyledTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableHead
    ref={ref}
    className={cn("text-muted-foreground font-normal", className)}
    {...props}
  />
));
StyledTableHead.displayName = "StyledTableHead";

export {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  // Re-export standard components for convenience
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  TableCaption,
};

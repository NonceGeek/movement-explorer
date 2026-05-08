import * as React from "react";
import {
  Table as DSTable,
  TableHeader as DSTableHeader,
  TableBody as DSTableBody,
  TableFooter as DSTableFooter,
  TableHead as DSTableHead,
  TableRow as DSTableRow,
  TableCell as DSTableCell,
  TableCaption as DSTableCaption,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/utils/styling";

const Table = React.forwardRef<
  React.ElementRef<typeof DSTable>,
  React.ComponentPropsWithoutRef<typeof DSTable>
>(({ className, ...props }, ref) => (
  <DSTable ref={ref} className={cn(className)} {...props} />
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  React.ElementRef<typeof DSTableHeader>,
  React.ComponentPropsWithoutRef<typeof DSTableHeader>
>(({ className, ...props }, ref) => (
  <DSTableHeader ref={ref} className={cn(className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  React.ElementRef<typeof DSTableBody>,
  React.ComponentPropsWithoutRef<typeof DSTableBody>
>(({ className, ...props }, ref) => (
  <DSTableBody ref={ref} className={cn(className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  React.ElementRef<typeof DSTableFooter>,
  React.ComponentPropsWithoutRef<typeof DSTableFooter>
>(({ className, ...props }, ref) => (
  <DSTableFooter ref={ref} className={cn(className)} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  React.ElementRef<typeof DSTableRow>,
  React.ComponentPropsWithoutRef<typeof DSTableRow>
>(({ className, ...props }, ref) => (
  <DSTableRow ref={ref} className={cn(className)} {...props} />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  React.ElementRef<typeof DSTableHead>,
  React.ComponentPropsWithoutRef<typeof DSTableHead>
>(({ className, ...props }, ref) => (
  <DSTableHead ref={ref} className={cn(className)} {...props} />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  React.ElementRef<typeof DSTableCell>,
  React.ComponentPropsWithoutRef<typeof DSTableCell>
>(({ className, ...props }, ref) => (
  <DSTableCell ref={ref} className={cn(className)} {...props} />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  React.ElementRef<typeof DSTableCaption>,
  React.ComponentPropsWithoutRef<typeof DSTableCaption>
>(({ className, ...props }, ref) => (
  <DSTableCaption ref={ref} className={cn(className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
};

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
      "bg-card backdrop-blur-sm rounded-xl border border-border/50 p-0 table-fixed overflow-y-hidden [&_td]:px-3 [&_th]:px-3",
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
    className={cn("text-foreground font-normal", className)}
    {...props}
  />
));
StyledTableHead.displayName = "StyledTableHead";

/**
 * StyledTableRow - A pre-styled table row with specific hover and border styles
 */
const StyledTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <TableRow
    ref={ref}
    className={cn(
      "hover:bg-accent group transition-colors border-b border-border/30 h-16",
      className,
    )}
    {...props}
  />
));
StyledTableRow.displayName = "StyledTableRow";

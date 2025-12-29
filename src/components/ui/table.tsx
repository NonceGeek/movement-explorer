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

import { cn } from "@/lib/utils";

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
};

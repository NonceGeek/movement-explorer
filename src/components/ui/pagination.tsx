import * as React from "react";
import {
  Pagination as DSPagination,
  PaginationContent as DSPaginationContent,
  PaginationLink as DSPaginationLink,
  PaginationItem as DSPaginationItem,
  PaginationPrevious as DSPaginationPrevious,
  PaginationNext as DSPaginationNext,
  PaginationEllipsis as DSPaginationEllipsis,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Pagination = React.forwardRef<
  React.ElementRef<typeof DSPagination>,
  React.ComponentPropsWithoutRef<typeof DSPagination>
>(({ className, ...props }, ref) => (
  <DSPagination ref={ref} className={cn(className)} {...props} />
));
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  React.ElementRef<typeof DSPaginationContent>,
  React.ComponentPropsWithoutRef<typeof DSPaginationContent>
>(({ className, ...props }, ref) => (
  <DSPaginationContent ref={ref} className={cn(className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  React.ElementRef<typeof DSPaginationItem>,
  React.ComponentPropsWithoutRef<typeof DSPaginationItem>
>(({ className, ...props }, ref) => (
  <DSPaginationItem ref={ref} className={cn(className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

const PaginationLink = React.forwardRef<
  React.ElementRef<typeof DSPaginationLink>,
  React.ComponentPropsWithoutRef<typeof DSPaginationLink>
>(({ className, ...props }, ref) => (
  <DSPaginationLink ref={ref} className={cn(className)} {...props} />
));
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = React.forwardRef<
  React.ElementRef<typeof DSPaginationPrevious>,
  React.ComponentPropsWithoutRef<typeof DSPaginationPrevious>
>(({ className, ...props }, ref) => (
  <DSPaginationPrevious ref={ref} className={cn(className)} {...props} />
));
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = React.forwardRef<
  React.ElementRef<typeof DSPaginationNext>,
  React.ComponentPropsWithoutRef<typeof DSPaginationNext>
>(({ className, ...props }, ref) => (
  <DSPaginationNext ref={ref} className={cn(className)} {...props} />
));
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = React.forwardRef<
  React.ElementRef<typeof DSPaginationEllipsis>,
  React.ComponentPropsWithoutRef<typeof DSPaginationEllipsis>
>(({ className, ...props }, ref) => (
  <DSPaginationEllipsis ref={ref} className={cn(className)} {...props} />
));
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

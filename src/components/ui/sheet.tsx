import * as React from "react";
import {
  Sheet as DSSheet,
  SheetTrigger as DSSheetTrigger,
  SheetClose as DSSheetClose,
  SheetContent as DSSheetContent,
  SheetHeader as DSSheetHeader,
  SheetFooter as DSSheetFooter,
  SheetTitle as DSSheetTitle,
  SheetDescription as DSSheetDescription,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Sheet = DSSheet;

const SheetTrigger = DSSheetTrigger;

const SheetClose = DSSheetClose;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DSSheetContent>,
  React.ComponentPropsWithoutRef<typeof DSSheetContent>
>(({ className, ...props }, ref) => (
  <DSSheetContent ref={ref} className={cn(className)} {...props} />
));
SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef<
  React.ElementRef<typeof DSSheetHeader>,
  React.ComponentPropsWithoutRef<typeof DSSheetHeader>
>(({ className, ...props }, ref) => (
  <DSSheetHeader ref={ref} className={cn(className)} {...props} />
));
SheetHeader.displayName = "SheetHeader";

const SheetFooter = React.forwardRef<
  React.ElementRef<typeof DSSheetFooter>,
  React.ComponentPropsWithoutRef<typeof DSSheetFooter>
>(({ className, ...props }, ref) => (
  <DSSheetFooter ref={ref} className={cn(className)} {...props} />
));
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DSSheetTitle>,
  React.ComponentPropsWithoutRef<typeof DSSheetTitle>
>(({ className, ...props }, ref) => (
  <DSSheetTitle ref={ref} className={cn(className)} {...props} />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DSSheetDescription>,
  React.ComponentPropsWithoutRef<typeof DSSheetDescription>
>(({ className, ...props }, ref) => (
  <DSSheetDescription ref={ref} className={cn(className)} {...props} />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

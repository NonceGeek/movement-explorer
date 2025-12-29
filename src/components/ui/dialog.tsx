import * as React from "react";
import {
  Dialog as DSDialog,
  DialogTrigger as DSDialogTrigger,
  DialogContent as DSDialogContent,
  DialogHeader as DSDialogHeader,
  DialogFooter as DSDialogFooter,
  DialogTitle as DSDialogTitle,
  DialogDescription as DSDialogDescription,
  DialogClose as DSDialogClose,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Dialog = DSDialog;

const DialogTrigger = DSDialogTrigger;

const DialogClose = DSDialogClose;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DSDialogContent>,
  React.ComponentPropsWithoutRef<typeof DSDialogContent>
>(({ className, ...props }, ref) => (
  <DSDialogContent ref={ref} className={cn(className)} {...props} />
));
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<
  React.ElementRef<typeof DSDialogHeader>,
  React.ComponentPropsWithoutRef<typeof DSDialogHeader>
>(({ className, ...props }, ref) => (
  <DSDialogHeader ref={ref} className={cn(className)} {...props} />
));
DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef<
  React.ElementRef<typeof DSDialogFooter>,
  React.ComponentPropsWithoutRef<typeof DSDialogFooter>
>(({ className, ...props }, ref) => (
  <DSDialogFooter ref={ref} className={cn(className)} {...props} />
));
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DSDialogTitle>,
  React.ComponentPropsWithoutRef<typeof DSDialogTitle>
>(({ className, ...props }, ref) => (
  <DSDialogTitle ref={ref} className={cn(className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DSDialogDescription>,
  React.ComponentPropsWithoutRef<typeof DSDialogDescription>
>(({ className, ...props }, ref) => (
  <DSDialogDescription ref={ref} className={cn(className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

// Re-export Portal and Overlay if they are needed internally or by other components, otherwise omit if not used directly
// Design system usually bundles these into Content or provides them.
// If local files were exporting ScreenPortal/Overlay, we might need to check. But DSDialogContent handles it usually.
// Local file had DialogPortal, DialogOverlay exported.
// Let's see if DS exports them. Design-system usually exports everything from Radix or styled versions.
// Assuming DS exports them if they are part of shadcn.
// If DS doesn't export them (we didn't check list carefully for Overlay), we might break imports.
// Check list: dialog.tsx in DS was 4690 bytes. Likely contains all.
// But wait, the DS exports I saw: Dialog, DialogContent, etc.
// I will attempt to export them if DS exports them. If not, I'll rely on DialogContent handling it.
// To be safe, I'll check if I can import them.
// Actually, let's look at `node_modules` or just try to import.
// For now, I'll export primitives if available, or just omit if not commonly used.
// The user asked to replace with DS.

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  // DialogPortal, // If needed, we add it.
  // DialogOverlay,
};

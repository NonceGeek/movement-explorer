import * as React from "react";
import {
  DropdownMenu as DSDropdownMenu,
  DropdownMenuTrigger as DSDropdownMenuTrigger,
  DropdownMenuContent as DSDropdownMenuContent,
  DropdownMenuItem as DSDropdownMenuItem,
  DropdownMenuCheckboxItem as DSDropdownMenuCheckboxItem,
  DropdownMenuRadioItem as DSDropdownMenuRadioItem,
  DropdownMenuLabel as DSDropdownMenuLabel,
  DropdownMenuSeparator as DSDropdownMenuSeparator,
  DropdownMenuShortcut as DSDropdownMenuShortcut,
  DropdownMenuGroup as DSDropdownMenuGroup,
  DropdownMenuPortal as DSDropdownMenuPortal,
  DropdownMenuSub as DSDropdownMenuSub,
  DropdownMenuSubContent as DSDropdownMenuSubContent,
  DropdownMenuSubTrigger as DSDropdownMenuSubTrigger,
  DropdownMenuRadioGroup as DSDropdownMenuRadioGroup,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const DropdownMenu = DSDropdownMenu;

const DropdownMenuTrigger = DSDropdownMenuTrigger;

const DropdownMenuGroup = DSDropdownMenuGroup;

const DropdownMenuPortal = DSDropdownMenuPortal;

const DropdownMenuSub = DSDropdownMenuSub;

const DropdownMenuRadioGroup = DSDropdownMenuRadioGroup;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuContent>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuContent>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuContent ref={ref} className={cn(className)} {...props} />
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuItem>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuItem ref={ref} className={cn(className)} {...props} />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuCheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuCheckboxItem>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuCheckboxItem ref={ref} className={cn(className)} {...props} />
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuRadioItem>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuRadioItem>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuRadioItem ref={ref} className={cn(className)} {...props} />
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuLabel>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuLabel>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuLabel ref={ref} className={cn(className)} {...props} />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuSeparator>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuSeparator>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuSeparator ref={ref} className={cn(className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuShortcut>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuShortcut>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuShortcut ref={ref} className={cn(className)} {...props} />
));
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuSubTrigger>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuSubTrigger>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuSubTrigger ref={ref} className={cn(className)} {...props} />
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DSDropdownMenuSubContent>,
  React.ComponentPropsWithoutRef<typeof DSDropdownMenuSubContent>
>(({ className, ...props }, ref) => (
  <DSDropdownMenuSubContent ref={ref} className={cn(className)} {...props} />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};

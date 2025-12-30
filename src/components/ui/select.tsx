import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Select as DSSelect,
  SelectContent as DSSelectContent,
  SelectValue as DSSelectValue,
  SelectGroup as DSSelectGroup,
  SelectLabel as DSSelectLabel,
  SelectSeparator as DSSelectSeparator,
} from "@movementlabsxyz/movement-design-system";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 1. Re-export base components from design system
 */
const Select = DSSelect;
const SelectGroup = DSSelectGroup;
const SelectValue = DSSelectValue;
const SelectLabel = DSSelectLabel;
const SelectSeparator = DSSelectSeparator;

/**
 * 2. Define custom variant types
 */
export type SelectTriggerVariant = "default" | "outline" | "ghost";

export interface SelectTriggerProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    "asChild"
  > {
  variant?: SelectTriggerVariant;
  icon?: React.ReactNode;
  size?: "sm" | "default";
}

/**
 * 3. Customizable SelectTrigger with variant and icon support
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    {
      className,
      variant = "default",
      icon,
      size = "default",
      children,
      ...props
    },
    ref
  ) => {
    // Handle custom variants
    let variantClassName = "";

    switch (variant) {
      case "outline":
        variantClassName =
          "rounded-md border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground";
        break;
      case "ghost":
        variantClassName =
          "border-0 bg-transparent hover:bg-primary hover:text-primary-foreground";
        break;
      case "default":
      default:
        // Use design system base styles
        variantClassName =
          "bg-semantic-base border-border-default data-placeholder:text-fg-muted [&_svg:not([class*='text-'])]:text-fg-subtle focus-visible:border-border-strong focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-semantic-alt-1 dark:hover:bg-semantic-alt-2 hover:bg-semantic-alt-1 disabled:bg-semantic-alt-2";
        break;
    }

    return (
      <SelectPrimitive.Trigger
        ref={ref}
        data-slot="select-trigger"
        data-size={size}
        className={cn(
          "flex w-fit items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-14 data-[size=sm]:h-10 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          variantClassName,
          className
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          {icon || <ChevronDown className="h-4 w-4 opacity-50" />}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

/**
 * 4. SelectContent - with custom styling
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof DSSelectContent>,
  React.ComponentPropsWithoutRef<typeof DSSelectContent>
>(({ className, children, position = "popper", ...props }, ref) => (
  <DSSelectContent
    ref={ref}
    className={cn(
      "rounded-xl border border-border bg-popover/95 backdrop-blur-sm py-1.5 shadow-lg",
      "min-w-(--radix-select-trigger-width) w-full",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className
    )}
    position={position}
    {...props}
  >
    {children}
  </DSSelectContent>
));
SelectContent.displayName = "SelectContent";

/**
 * 5. SelectItem - with custom styling using Radix primitives
 */
const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex items-center justify-between",
      "rounded-lg mx-1.5 px-3 py-2.5 my-0.5",
      "cursor-pointer outline-none transition-colors",
      "focus:bg-primary focus:text-primary-foreground",
      "hover:bg-primary/10",
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
};

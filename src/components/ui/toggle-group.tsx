"use client";

import * as React from "react";
import { cn } from "@/utils/styling";

/* ------------------------------------------------------------------ */
/*  ToggleGroup                                                        */
/* ------------------------------------------------------------------ */

type ToggleGroupSize = "sm" | "default";
type ToggleGroupVariant = "default" | "brand";

interface ToggleGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  size: ToggleGroupSize;
  variant: ToggleGroupVariant;
  disabled: boolean;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null,
);

interface ToggleGroupProps {
  value: string;
  onValueChange?: (value: string) => void;
  size?: ToggleGroupSize;
  variant?: ToggleGroupVariant;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      value,
      onValueChange = () => {},
      size = "sm",
      variant = "brand",
      disabled = false,
      className,
      children,
    },
    ref,
  ) => (
    <ToggleGroupContext.Provider
      value={{ value, onValueChange, size, variant, disabled }}
    >
      <div
        ref={ref}
        role="radiogroup"
        aria-disabled={disabled}
        className={cn(
          "inline-flex items-center rounded-lg p-0.5 border border-border bg-muted/30",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  ),
);
ToggleGroup.displayName = "ToggleGroup";

/* ------------------------------------------------------------------ */
/*  ToggleGroupItem                                                    */
/* ------------------------------------------------------------------ */

interface ToggleGroupItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const sizeStyles: Record<ToggleGroupSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  default: "px-4 py-2 text-sm gap-2",
};

const activeStyles: Record<ToggleGroupVariant, string> = {
  default: "bg-background text-foreground shadow-sm",
  brand: "bg-guild-green-500 text-black shadow-sm",
};

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ value, className, children }, ref) => {
  const ctx = React.useContext(ToggleGroupContext);
  if (!ctx) throw new Error("ToggleGroupItem must be used within ToggleGroup");

  const isActive = ctx.value === value;

  return (
    <button
      ref={ref}
      role="radio"
      type="button"
      aria-checked={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center rounded-md font-medium transition-colors duration-200 cursor-pointer",
        sizeStyles[ctx.size],
        isActive
          ? activeStyles[ctx.variant]
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupVariant, ToggleGroupSize };

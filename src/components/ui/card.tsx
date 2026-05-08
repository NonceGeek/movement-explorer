"use client";

import * as React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

import { cn } from "@/utils/styling";

// Local Card primitives — replace the design-system Card so we can fully
// control the surface (no glass-background gradient, no backdrop blur).
// Keeps the same exported API as the previous wrapper.

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn(
      "flex flex-col gap-4 md:gap-6 rounded-xl border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn(
      "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] md:gap-3 md:px-6 [.border-b]:pb-4 [.border-b]:md:pb-6",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn(
      "flex items-center px-4 md:px-6 [.border-t]:pt-4 [.border-t]:md:pt-6",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-title"
    className={cn("leading-none font-semibold", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn("px-4 md:px-6", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

// Collapsible section card variant
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

function SectionCard({
  title,
  children,
  defaultCollapsed = false,
  className,
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left cursor-pointer"
      >
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <span className="transition-transform duration-200">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isCollapsed
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
SectionCard.displayName = "SectionCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  SectionCard,
};

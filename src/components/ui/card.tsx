"use client";

import * as React from "react";
import {
  Card as DSCard,
  CardHeader as DSCardHeader,
  CardFooter as DSCardFooter,
  CardTitle as DSCardTitle,
  CardDescription as DSCardDescription,
  CardContent as DSCardContent,
} from "@movementlabsxyz/movement-design-system";
import { ChevronRight, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  React.ElementRef<typeof DSCard>,
  React.ComponentPropsWithoutRef<typeof DSCard>
>(({ className, ...props }, ref) => (
  <DSCard ref={ref} className={cn(className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  React.ElementRef<typeof DSCardHeader>,
  React.ComponentPropsWithoutRef<typeof DSCardHeader>
>(({ className, ...props }, ref) => (
  <DSCardHeader ref={ref} className={cn(className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardFooter = React.forwardRef<
  React.ElementRef<typeof DSCardFooter>,
  React.ComponentPropsWithoutRef<typeof DSCardFooter>
>(({ className, ...props }, ref) => (
  <DSCardFooter ref={ref} className={cn(className)} {...props} />
));
CardFooter.displayName = "CardFooter";

const CardTitle = React.forwardRef<
  React.ElementRef<typeof DSCardTitle>,
  React.ComponentPropsWithoutRef<typeof DSCardTitle>
>(({ className, ...props }, ref) => (
  <DSCardTitle ref={ref} className={cn(className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  React.ElementRef<typeof DSCardDescription>,
  React.ComponentPropsWithoutRef<typeof DSCardDescription>
>(({ className, ...props }, ref) => (
  <DSCardDescription ref={ref} className={cn(className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  React.ElementRef<typeof DSCardContent>,
  React.ComponentPropsWithoutRef<typeof DSCardContent>
>(({ className, ...props }, ref) => (
  <DSCardContent ref={ref} className={cn(className)} {...props} />
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
        "rounded-lg border border-border bg-card/50 p-4",
        className
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
            : "grid-rows-[1fr] opacity-100"
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

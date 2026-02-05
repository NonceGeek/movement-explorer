"use client";

import * as React from "react";
import { cn } from "@/utils/styling";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ChartSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * ChartSection - Collapsible wrapper for chart groups
 * Features:
 * - Smooth expand/collapse animation
 * - Section title with icon
 * - Default open/closed state
 * - Scroll anchor support for sidebar navigation
 * - Etherscan-inspired styling
 */
export default function ChartSection({
  id,
  title,
  icon,
  children,
  defaultOpen = false,
}: ChartSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <section
      id={`section-${id}`}
      className="rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm scroll-mt-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors duration-200 rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span className="transition-transform duration-200">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-0 space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

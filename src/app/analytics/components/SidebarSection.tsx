"use client";

import * as React from "react";
import { cn } from "@/utils/styling";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * SidebarSection - Collapsible section wrapper for analytics sidebar
 * Features:
 * - Smooth expand/collapse animation
 * - ChevronDown/ChevronRight toggle icon
 * - Optional section icon
 * - Default open/closed state
 */
export default function SidebarSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{title}</span>
        </div>
        <span className="transition-transform duration-200">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 pb-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

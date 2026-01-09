"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { JsonViewer } from "@/components/ui/json-viewer";
import { cn } from "@/lib/utils";

interface CollapsibleItemCardProps {
  title: string;
  data: unknown;
  /** Controlled expand state */
  isExpanded?: boolean;
  /** Callback when toggle is clicked */
  onToggle?: () => void;
}

export function CollapsibleItemCard({
  title,
  data,
  isExpanded = false,
  onToggle,
}: CollapsibleItemCardProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full text-left p-4 transition-colors cursor-pointer",
          isExpanded ? "bg-muted/30" : "hover:bg-muted/30"
        )}
      >
        <p className="text-sm text-muted-foreground">{title}</p>
        <span className="transition-transform duration-200">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2">
            <JsonViewer data={data} initialDepth={1} />
          </div>
        </div>
      </div>
    </div>
  );
}

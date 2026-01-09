"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface CollapsibleJsonProps {
  data: unknown;
  label: string;
}

export function CollapsibleJson({ data, label }: CollapsibleJsonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {isExpanded ? "Hide" : "Show"} {label}
      </button>
      {isExpanded && (
        <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleItemCard } from "./CollapsibleItemCard";

interface CollapsibleListItem {
  key: string | number;
  title: string;
  data: unknown;
}

interface CollapsibleListProps {
  items: CollapsibleListItem[];
  emptyMessage?: string;
  /** Default expanded state for all items */
  defaultExpanded?: boolean;
}

export function CollapsibleList({
  items,
  emptyMessage = "No items",
  defaultExpanded = false,
}: CollapsibleListProps) {
  // Track expanded state for each item
  const [expandedStates, setExpandedStates] = useState<
    Record<string | number, boolean>
  >(() => {
    const initial: Record<string | number, boolean> = {};
    items.forEach((item) => {
      initial[item.key] = defaultExpanded;
    });
    return initial;
  });
  // Track if all items are currently expanded (for button display)
  const [allExpanded, setAllExpanded] = useState(defaultExpanded);

  // Update states when items change
  useEffect(() => {
    setExpandedStates((prev) => {
      const newStates = { ...prev };
      items.forEach((item) => {
        if (newStates[item.key] === undefined) {
          newStates[item.key] = defaultExpanded;
        }
      });
      return newStates;
    });
  }, [items, defaultExpanded]);

  const handleToggle = useCallback((key: string | number) => {
    setExpandedStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    const newExpanded = !allExpanded;
    setAllExpanded(newExpanded);
    const newStates: Record<string | number, boolean> = {};
    items.forEach((item) => {
      newStates[item.key] = newExpanded;
    });
    setExpandedStates(newStates);
  }, [allExpanded, items]);

  // Check if all items are expanded to update button state
  useEffect(() => {
    if (items.length === 0) return;
    const allAreExpanded = items.every(
      (item) => expandedStates[item.key] === true
    );
    setAllExpanded(allAreExpanded);
  }, [expandedStates, items]);

  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          className="gap-2 cursor-pointer"
        >
          {allExpanded ? (
            <>
              <ChevronsDownUp className="w-4 h-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronsUpDown className="w-4 h-4" />
              Expand All
            </>
          )}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <CollapsibleItemCard
            key={item.key}
            title={item.title}
            data={item.data}
            isExpanded={expandedStates[item.key] ?? defaultExpanded}
            onToggle={() => handleToggle(item.key)}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";
import {
  ChevronDown,
  ChevronRight,
  Zap,
  List,
  GitBranch,
} from "lucide-react";
import { CollapsibleList } from "./CollapsibleList";
import type { Types } from "aptos";

interface ParsedEvent {
  id: string;
  type: "event";
  eventType: string;
  eventData: unknown;
  moduleName: string;
  eventName: string;
  sequenceNumber: string;
}

interface EventsTabProps {
  events: Types.Event[];
  className?: string;
}

// Parse events into structured format - only contract events
function parseEvents(events: Types.Event[]): ParsedEvent[] {
  // Filter out coin/fungible asset/transaction fee events
  // These are already shown in Balance Changes tab
  const contractEvents = events.filter(
    (e) =>
      !e.type.startsWith("0x1::coin::") &&
      !e.type.startsWith("0x1::fungible_asset::") &&
      !e.type.startsWith("0x1::transaction_fee::")
  );

  return contractEvents.map((event, index) => {
    const parts = event.type.split("::");
    const moduleName = parts[1] || "";
    const eventName = parts.slice(2).join("::");

    return {
      id: `event-${index}`,
      type: "event" as const,
      eventType: event.type,
      eventData: event.data,
      moduleName,
      eventName,
      sequenceNumber: event.sequence_number,
    };
  });
}

export function EventsTab({ events, className }: EventsTabProps) {
  const [viewMode, setViewMode] = useState<"flow" | "raw">("flow");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const parsedEvents = useMemo(() => parseEvents(events), [events]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const eventCount = parsedEvents.length;

  if (events.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-center py-8", className)}>
        No events in this transaction
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "flow" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("flow")}
            className="gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Flow
          </Button>
          <Button
            variant={viewMode === "raw" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("raw")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Raw ({events.length})
          </Button>
        </div>

        {viewMode === "flow" && eventCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-purple-500 bg-purple-500/10">
              <Zap className="h-3.5 w-3.5" />
              {eventCount} Event{eventCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>

      {viewMode === "raw" ? (
        <CollapsibleList
          items={events.map((event, i) => ({
            key: i,
            title: `#${event.sequence_number} - ${event.type}`,
            data: event.data,
          }))}
          emptyMessage="No events"
        />
      ) : (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
          {parsedEvents.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Zap className="h-12 w-12 opacity-20" />
                <p className="font-medium">No Contract Events</p>
                <p className="text-sm">
                  This transaction only contains balance changes.
                  <br />
                  Check the <span className="font-semibold">Balance Changes</span> tab for details.
                </p>
              </div>
            </div>
          ) : (
            parsedEvents.map((item, index) => (
              <EventFlowItem
                key={item.id}
                item={item}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                isLast={index === parsedEvents.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface EventFlowItemProps {
  item: ParsedEvent;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

function EventFlowItem({ item, isExpanded, onToggle, isLast }: EventFlowItemProps) {
  const hasDetails = item.eventData !== undefined;

  return (
    <div className={cn(!isLast && "border-b border-border/30")}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors",
          hasDetails && "cursor-pointer"
        )}
        onClick={hasDetails ? onToggle : undefined}
      >
        {/* Expand/Collapse indicator */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasDetails ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          )}
        </div>

        {/* Icon */}
        <div className="flex items-center justify-center w-7 h-7 rounded border bg-purple-500/10 text-purple-500 border-purple-500/20">
          <Zap className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            #{item.sequenceNumber}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {item.moduleName}::{item.eventName}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && item.eventData !== undefined && (
        <div className="px-4 pb-3 pl-16">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Event Data</div>
            <pre className="font-mono text-xs overflow-auto max-h-40 text-foreground">
              {JSON.stringify(item.eventData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

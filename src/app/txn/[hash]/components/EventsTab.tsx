"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { cn } from "@/utils/styling";
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Coins,
  Zap,
  List,
  GitBranch,
} from "lucide-react";
import { formatMoveAmount } from "@/utils/transaction";
import { CollapsibleList } from "./CollapsibleList";
import type { Types } from "aptos";

interface ParsedEvent {
  id: string;
  type: "transfer" | "event";
  from?: string;
  to?: string;
  amount?: string;
  symbol?: string;
  eventType?: string;
  eventData?: unknown;
  moduleName?: string;
  eventName?: string;
}

interface EventsTabProps {
  events: Types.Event[];
  className?: string;
}

// Parse events into structured format
function parseEvents(events: Types.Event[]): ParsedEvent[] {
  const parsed: ParsedEvent[] = [];
  let idCounter = 0;

  const depositEvents = events.filter(
    (e) =>
      e.type === "0x1::coin::DepositEvent" ||
      e.type === "0x1::fungible_asset::Deposit"
  );
  const withdrawEvents = events.filter(
    (e) =>
      e.type === "0x1::coin::WithdrawEvent" ||
      e.type === "0x1::fungible_asset::Withdraw"
  );

  // Match withdraw and deposit events to create transfer entries
  const processedDeposits = new Set<number>();

  withdrawEvents.forEach((withdrawEvent) => {
    const withdrawAddr = withdrawEvent.guid.account_address;
    const withdrawAmount = withdrawEvent.data?.amount;

    const matchingDepositIdx = depositEvents.findIndex((depositEvent, idx) => {
      if (processedDeposits.has(idx)) return false;
      return depositEvent.data?.amount === withdrawAmount;
    });

    if (matchingDepositIdx !== -1) {
      const depositEvent = depositEvents[matchingDepositIdx];
      processedDeposits.add(matchingDepositIdx);

      parsed.push({
        id: `transfer-${idCounter++}`,
        type: "transfer",
        from: withdrawAddr,
        to: depositEvent.guid.account_address,
        amount: formatMoveAmount(withdrawAmount || "0"),
        symbol: "MOVE",
      });
    }
  });

  // Add other events (not deposit/withdraw)
  const otherEvents = events.filter(
    (e) =>
      !e.type.startsWith("0x1::coin::") &&
      !e.type.startsWith("0x1::fungible_asset::") &&
      !e.type.startsWith("0x1::transaction_fee::")
  );

  otherEvents.forEach((event) => {
    const parts = event.type.split("::");
    const moduleName = parts[1] || "";
    const eventName = parts.slice(2).join("::");

    parsed.push({
      id: `event-${idCounter++}`,
      type: "event",
      eventType: event.type,
      eventData: event.data,
      moduleName,
      eventName,
    });
  });

  return parsed;
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

  // Stats
  const transferCount = parsedEvents.filter((e) => e.type === "transfer").length;
  const eventCount = parsedEvents.filter((e) => e.type === "event").length;

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

        {viewMode === "flow" && (transferCount > 0 || eventCount > 0) && (
          <div className="flex items-center gap-2">
            {transferCount > 0 && (
              <Badge variant="outline" className="gap-1.5 text-green-500 bg-green-500/10">
                <Coins className="h-3.5 w-3.5" />
                {transferCount} Transfer{transferCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {eventCount > 0 && (
              <Badge variant="outline" className="gap-1.5 text-purple-500 bg-purple-500/10">
                <Zap className="h-3.5 w-3.5" />
                {eventCount} Event{eventCount !== 1 ? "s" : ""}
              </Badge>
            )}
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
              No transfers or contract events detected
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
  const hasDetails = item.type === "event" && item.eventData !== undefined;

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
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded border",
            item.type === "transfer"
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-purple-500/10 text-purple-500 border-purple-500/20"
          )}
        >
          {item.type === "transfer" ? (
            <Coins className="h-4 w-4" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          {item.type === "transfer" && (
            <>
              <Badge variant="secondary" className="text-xs">
                Transfer
              </Badge>
              {item.from && (
                <CopyableAddress
                  address={item.from}
                  href={`/account/${item.from}`}
                  truncateLength={{ start: 6, end: 4 }}
                />
              )}
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              {item.to && (
                <CopyableAddress
                  address={item.to}
                  href={`/account/${item.to}`}
                  truncateLength={{ start: 6, end: 4 }}
                />
              )}
              <span className="font-mono text-sm text-green-500">
                +{item.amount} {item.symbol}
              </span>
            </>
          )}

          {item.type === "event" && (
            <>
              <Badge variant="secondary" className="text-xs">
                Event
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {item.moduleName}::{item.eventName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && item.eventData !== undefined ? (
        <div className="px-4 pb-3 pl-16">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Event Data</div>
            <pre className="font-mono text-xs overflow-auto max-h-40 text-foreground">
              {JSON.stringify(item.eventData, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

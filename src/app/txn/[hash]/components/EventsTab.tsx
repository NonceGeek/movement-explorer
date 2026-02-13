"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";
import { ChevronDown, ChevronRight, Table2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SortableHeader, type SortDirection } from "@/components/ui/sortable-header";
import type { Types } from "aptos";
import {
  TableBody,
  TableCell,
  TableRow,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
  StyledTable as Table,
} from "@/components/ui/table";

interface ParsedEvent {
  id: string;
  type: "event";
  eventType: string;
  eventData: unknown;
  accountAddress: string;
  moduleName: string;
  eventName: string;
  sequenceNumber: string;
}

interface EventsTabProps {
  events: Types.Event[];
  className?: string;
}

function parseEvents(events: Types.Event[]): ParsedEvent[] {
  return events.map((event, index) => {
    const parts = event.type.split("::");
    const accountAddress = parts[0] || "";
    const moduleName = parts[1] || "";
    const eventName = parts.slice(2).join("::");

    return {
      id: `event-${index}`,
      type: "event" as const,
      eventType: event.type,
      eventData: event.data,
      accountAddress,
      moduleName,
      eventName,
      sequenceNumber: event.sequence_number,
    };
  });
}

type EventSortColumn = "account" | "module" | "event";

export function EventsTab({ events, className }: EventsTabProps) {
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<EventSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const parsedEvents = useMemo(() => parseEvents(events), [events]);

  const sortedEvents = useMemo(() => {
    if (!sortColumn) return parsedEvents;

    const keyMap: Record<EventSortColumn, keyof ParsedEvent> = {
      account: "accountAddress",
      module: "moduleName",
      event: "eventName",
    };
    const key = keyMap[sortColumn];

    return [...parsedEvents].sort((a, b) => {
      const cmp = String(a[key]).localeCompare(String(b[key]));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [parsedEvents, sortColumn, sortDirection]);

  const handleSort = (column: EventSortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "desc") {
        // Third click: reset to default order
        setSortColumn(null);
        setSortDirection("asc");
      } else {
        setSortDirection("desc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

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
      <ToggleGroup value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "raw")}>
        <ToggleGroupItem value="table">
          <Table2 className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="raw">
          RAW
        </ToggleGroupItem>
      </ToggleGroup>

      {viewMode === "raw" ? (
        <JsonViewer data={events} initialDepth={2} />
      ) : (
        <EventTable
          events={sortedEvents}
          expandedItems={expandedItems}
          onToggle={toggleItem}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
}

interface EventTableProps {
  events: ParsedEvent[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  sortColumn: EventSortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: EventSortColumn) => void;
}

function EventTable({
  events,
  expandedItems,
  onToggle,
  sortColumn,
  sortDirection,
  onSort,
}: EventTableProps) {
  return (
    <Table>
      <TableHeader>
        <HeaderRow>
          <SortableHeader
            label="Account"
            column="account"
            currentColumn={sortColumn}
            currentDirection={sortDirection}
            onSort={onSort}
            className="w-[30%]"
          />
          <SortableHeader
            label="Module"
            column="module"
            currentColumn={sortColumn}
            currentDirection={sortDirection}
            onSort={onSort}
            className="w-[25%]"
          />
          <SortableHeader
            label="Event"
            column="event"
            currentColumn={sortColumn}
            currentDirection={sortDirection}
            onSort={onSort}
            className="w-[35%]"
          />
          <TableHead className="w-[10%] text-center">Data</TableHead>
        </HeaderRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            isExpanded={expandedItems.has(event.id)}
            onToggle={() => onToggle(event.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface EventRowProps {
  event: ParsedEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

function EventRow({ event, isExpanded, onToggle }: EventRowProps) {
  return (
    <>
      <TableRow
        className="hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-12 cursor-pointer"
        onClick={onToggle}
      >
        <TableCell>
          <CopyableAddress
            address={event.accountAddress}
            href={`/account/${event.accountAddress}`}
            truncateLength={{ start: 6, end: 4 }}
          />
        </TableCell>

        <TableCell>
          <Badge variant="outline" className="font-mono text-xs">
            {event.moduleName}
          </Badge>
        </TableCell>

        <TableCell>
          <span className="font-mono text-xs text-muted-foreground">
            {event.eventName}
          </span>
        </TableCell>

        <TableCell className="text-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground inline-block" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
          )}
        </TableCell>
      </TableRow>

      {isExpanded && event.eventData !== undefined && (
        <TableRow className="hover:bg-transparent border-b border-border/30">
          <TableCell colSpan={4} className="p-0">
            <div className="bg-muted/20 px-6 py-4">
              <div className="text-xs text-muted-foreground mb-2 font-medium">
                Event Data
              </div>
              <JsonViewer data={event.eventData} initialDepth={1} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

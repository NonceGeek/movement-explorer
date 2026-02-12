"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";
import {
  ChevronDown,
  ChevronRight,
  FileEdit,
  FileX,
  Database,
  Table2,
  Package,
  Layers,
  Filter,
} from "lucide-react";
import type { Types } from "aptos";

type ChangeType = "write_resource" | "delete_resource" | "write_table_item" | "delete_table_item" | "write_module";

interface GroupedChange {
  type: ChangeType;
  address: string;
  changes: Types.WriteSetChange[];
}

interface ChangesTabProps {
  changes: Types.WriteSetChange[];
  className?: string;
}

const CHANGE_TYPE_INFO: Record<
  ChangeType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  write_resource: {
    label: "Write Resource",
    icon: <FileEdit className="h-4 w-4" />,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  delete_resource: {
    label: "Delete Resource",
    icon: <FileX className="h-4 w-4" />,
    color: "text-red-500 bg-red-500/10 border-red-500/20",
  },
  write_table_item: {
    label: "Write Table Item",
    icon: <Table2 className="h-4 w-4" />,
    color: "text-green-500 bg-green-500/10 border-green-500/20",
  },
  delete_table_item: {
    label: "Delete Table Item",
    icon: <FileX className="h-4 w-4" />,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  write_module: {
    label: "Write Module",
    icon: <Package className="h-4 w-4" />,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
};

export function ChangesTab({ changes, className }: ChangesTabProps) {
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<ChangeType | "all">("all");

  // Group changes by type and address
  const groupedChanges = useMemo(() => {
    const groups: Map<string, GroupedChange> = new Map();

    changes.forEach((change) => {
      const type = change.type as ChangeType;
      const address = "address" in change ? change.address : "table";
      const key = `${type}:${address}`;

      if (!groups.has(key)) {
        groups.set(key, { type, address, changes: [] });
      }
      groups.get(key)!.changes.push(change);
    });

    return Array.from(groups.values());
  }, [changes]);

  // Filter changes
  const filteredChanges = useMemo(() => {
    if (filterType === "all") return changes;
    return changes.filter((c) => c.type === filterType);
  }, [changes, filterType]);

  const filteredGroups = useMemo(() => {
    if (filterType === "all") return groupedChanges;
    return groupedChanges.filter((g) => g.type === filterType);
  }, [groupedChanges, filterType]);

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    changes.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return counts;
  }, [changes]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allKeys = filteredGroups.map((g) => `${g.type}:${g.address}`);
    setExpandedGroups(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  if (changes.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No state changes in this transaction
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grouped" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grouped")}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Grouped
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            List
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ChangeType | "all")}
            className="text-sm bg-muted border border-border rounded px-2 py-1"
          >
            <option value="all">All ({changes.length})</option>
            {Object.entries(stats).map(([type, count]) => (
              <option key={type} value={type}>
                {CHANGE_TYPE_INFO[type as ChangeType]?.label || type} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats).map(([type, count]) => {
          const info = CHANGE_TYPE_INFO[type as ChangeType];
          if (!info) return null;
          return (
            <Badge
              key={type}
              variant="outline"
              className={cn(
                "gap-1.5 cursor-pointer",
                filterType === type && info.color
              )}
              onClick={() =>
                setFilterType(filterType === type ? "all" : (type as ChangeType))
              }
            >
              {info.icon}
              {info.label}: {count}
            </Badge>
          );
        })}
      </div>

      {viewMode === "grouped" ? (
        <div className="space-y-2">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>

          {filteredGroups.map((group) => {
            const key = `${group.type}:${group.address}`;
            const isExpanded = expandedGroups.has(key);
            const info = CHANGE_TYPE_INFO[group.type];

            return (
              <div
                key={key}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded border",
                      info?.color
                    )}
                  >
                    {info?.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {info?.label || group.type}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {group.changes.length}
                      </Badge>
                    </div>
                    {group.address !== "table" && (
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {group.address.slice(0, 10)}...{group.address.slice(-8)}
                      </div>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/30">
                    {group.changes.map((change, i) => (
                      <ChangeItem
                        key={i}
                        change={change}
                        index={i}
                        isExpanded={expandedItems.has(`${key}:${i}`)}
                        onToggle={() => toggleItem(`${key}:${i}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChanges.slice(0, 100).map((change, i) => (
            <ChangeItem
              key={i}
              change={change}
              index={i}
              isExpanded={expandedItems.has(`list:${i}`)}
              onToggle={() => toggleItem(`list:${i}`)}
              showType
            />
          ))}
          {filteredChanges.length > 100 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Showing 100 of {filteredChanges.length} changes
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ChangeItemProps {
  change: Types.WriteSetChange;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  showType?: boolean;
}

function ChangeItem({
  change,
  index,
  isExpanded,
  onToggle,
  showType,
}: ChangeItemProps) {
  const type = change.type as ChangeType;
  const info = CHANGE_TYPE_INFO[type];
  const address = "address" in change ? change.address : null;
  const data = "data" in change ? change.data : null;

  // Extract resource type for display
  const resourceType =
    data && typeof data === "object" && "type" in data
      ? (data as { type: string }).type
      : null;

  // For table items
  const handle = "handle" in change ? (change as { handle: string }).handle : null;
  const tableKey = "key" in change ? (change as { key: string }).key : null;

  return (
    <div className="border-b border-border/20 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}

        <span className="text-xs text-muted-foreground font-mono w-6">
          #{index}
        </span>

        {showType && info && (
          <Badge variant="outline" className={cn("text-xs gap-1", info.color)}>
            {info.icon}
            {info.label}
          </Badge>
        )}

        <div className="flex-1 min-w-0">
          {resourceType && (
            <div className="font-mono text-xs text-foreground truncate">
              {formatResourceType(resourceType)}
            </div>
          )}
          {handle && (
            <div className="font-mono text-xs text-muted-foreground truncate">
              Table: {handle.slice(0, 8)}...
            </div>
          )}
          {address && !resourceType && (
            <div className="font-mono text-xs text-muted-foreground">
              {address.slice(0, 10)}...{address.slice(-6)}
            </div>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3">
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            {address && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Address:</span>
                <CopyableAddress
                  address={address}
                  href={`/account/${address}`}
                  truncateLength={{ start: 10, end: 8 }}
                />
              </div>
            )}

            {handle && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Handle:</span>
                <CopyableAddress
                  address={handle}
                  truncateLength={{ start: 10, end: 8 }}
                  variant="hash"
                />
              </div>
            )}

            {tableKey && (
              <div>
                <span className="text-xs text-muted-foreground">Key:</span>
                <div className="mt-1 font-mono text-xs bg-muted/50 p-2 rounded overflow-auto max-h-20">
                  {tableKey}
                </div>
              </div>
            )}

            {data && (
              <div>
                <span className="text-xs text-muted-foreground">Data:</span>
                <div className="mt-1">
                  <JsonViewer data={data} initialDepth={1} />
                </div>
              </div>
            )}

            {"value" in change && (
              <div>
                <span className="text-xs text-muted-foreground">Value:</span>
                <div className="mt-1 font-mono text-xs bg-muted/50 p-2 rounded overflow-auto max-h-40">
                  {String((change as { value: string }).value)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatResourceType(type: string): string {
  // Extract the module and struct name for cleaner display
  const parts = type.split("::");
  if (parts.length >= 3) {
    const modName = parts[1];
    const struct = parts.slice(2).join("::");
    return `${modName}::${struct}`;
  }
  return type;
}

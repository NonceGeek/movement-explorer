"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  SortableHeader,
  type SortDirection,
} from "@/components/ui/sortable-header";
import {
  ChevronDown,
  ChevronRight,
  FileEdit,
  FileX,
  Table2,
  Package,
} from "lucide-react";
import {
  TableBody,
  TableCell,
  TableRow,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
  StyledTable as Table,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Types } from "aptos";
import { formatMovementPath } from "@/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChangeType =
  | "write_resource"
  | "delete_resource"
  | "write_table_item"
  | "delete_table_item"
  | "write_module"
  | "delete_module";

type ChangeCategory = "write" | "delete" | "module";

interface ParsedChange {
  id: string;
  type: ChangeType;
  category: ChangeCategory;
  address: string | null;
  resourceType: string | null;
  displayName: string;
  moduleLink: string | null;
  handle: string | null;
  tableKey: string | null;
  data: unknown | null;
  value: string | null;
}

interface ChangesTabProps {
  changes: Types.WriteSetChange[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANGE_TYPE_META: Record<
  ChangeType,
  {
    label: string;
    icon: React.ReactNode;
    category: ChangeCategory;
    badgeVariant: "outline" | "secondary" | "error";
  }
> = {
  write_resource: {
    label: "Write Res",
    icon: <FileEdit className="h-3 w-3" />,
    category: "write",
    badgeVariant: "outline",
  },
  delete_resource: {
    label: "Del Res",
    icon: <FileX className="h-3 w-3" />,
    category: "delete",
    badgeVariant: "error",
  },
  write_table_item: {
    label: "Write Table",
    icon: <Table2 className="h-3 w-3" />,
    category: "write",
    badgeVariant: "outline",
  },
  delete_table_item: {
    label: "Del Table",
    icon: <FileX className="h-3 w-3" />,
    category: "delete",
    badgeVariant: "error",
  },
  write_module: {
    label: "Module",
    icon: <Package className="h-3 w-3" />,
    category: "module",
    badgeVariant: "secondary",
  },
  delete_module: {
    label: "Del Module",
    icon: <FileX className="h-3 w-3" />,
    category: "delete",
    badgeVariant: "error",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(addr: string): string {
  if (addr.length <= 6) return addr; // 0x1, 0xa etc.
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatResourceType(type: string): string {
  const parts = type.split("::");
  if (parts.length >= 3) {
    const addr = truncateAddress(parts[0]);
    const modName = formatMovementPath(parts[1]);
    const struct = formatMovementPath(parts.slice(2).join("::"));
    return `${addr}::${modName}::${struct}`;
  }
  return type;
}

/** Build a link to the module page from a resource type or module ID */
function buildModuleLink(typeOrModuleId: string): string | null {
  const parts = typeOrModuleId.split("::");
  if (parts.length >= 2) {
    const addr = parts[0];
    const modName = parts[1];
    return `/account/${addr}/modules/code/${modName}`;
  }
  return null;
}

/** Parse a resource type / module ID into { addr, moduleName, structName } */
function parseModuleParts(typeOrModuleId: string): {
  addr: string;
  moduleName: string;
  structName: string | null;
} | null {
  const parts = typeOrModuleId.split("::");
  if (parts.length >= 2) {
    return {
      addr: parts[0],
      moduleName: parts[1],
      structName: parts.length >= 3 ? parts.slice(2).join("::") : null,
    };
  }
  return null;
}

function parseChanges(changes: Types.WriteSetChange[]): ParsedChange[] {
  return changes.map((change, index) => {
    const type = change.type as ChangeType;
    const meta = CHANGE_TYPE_META[type];
    const address =
      "address" in change ? (change as { address: string }).address : null;
    const data = "data" in change ? change.data : null;
    const resourceType =
      data && typeof data === "object" && "type" in (data as object)
        ? (data as { type: string }).type
        : null;
    const handle =
      "handle" in change ? (change as { handle: string }).handle : null;
    const tableKey =
      "key" in change ? (change as { key: string }).key : null;
    const value =
      "value" in change
        ? String((change as { value: string }).value)
        : null;
    const resource =
      "resource" in change
        ? (change as { resource: string }).resource
        : null;

    // Module ID for write_module / delete_module
    const moduleId =
      "module" in change
        ? String((change as { module: string }).module)
        : null;

    let displayName: string;
    if (resourceType) {
      displayName = formatResourceType(resourceType);
    } else if (resource) {
      displayName = formatResourceType(resource);
    } else if (moduleId) {
      displayName = moduleId;
    } else if (handle) {
      displayName = "—";
    } else {
      displayName = meta?.label || type;
    }

    const rawType = resourceType || resource || moduleId;
    const moduleLink = rawType ? buildModuleLink(rawType) : null;

    return {
      id: `change-${index}`,
      type,
      category: meta?.category || "write",
      address,
      resourceType: resourceType || resource,
      displayName,
      moduleLink,
      handle,
      tableKey,
      data,
      value,
    };
  });
}

// ---------------------------------------------------------------------------
// ChangesTab (main export)
// ---------------------------------------------------------------------------

type ChangeSortColumn = "address" | "type" | "resource";

export function ChangesTab({ changes, className }: ChangesTabProps) {
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<ChangeSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const parsedChanges = useMemo(() => parseChanges(changes), [changes]);

  const sortedChanges = useMemo(() => {
    if (!sortColumn) return parsedChanges;

    const keyMap: Record<ChangeSortColumn, keyof ParsedChange> = {
      address: "address",
      type: "type",
      resource: "displayName",
    };
    const key = keyMap[sortColumn];

    return [...parsedChanges].sort((a, b) => {
      const cmp = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [parsedChanges, sortColumn, sortDirection]);

  const handleSort = (column: ChangeSortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "desc") {
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (changes.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground text-center py-12 text-sm",
          className
        )}
      >
        No state changes in this transaction
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <ToggleGroup
        value={viewMode}
        onValueChange={(v) => v && setViewMode(v as "table" | "raw")}
      >
        <ToggleGroupItem value="table">
          <Table2 className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="raw">RAW</ToggleGroupItem>
      </ToggleGroup>

      {viewMode === "raw" ? (
        <JsonViewer data={changes} initialDepth={2} />
      ) : (
        <ChangesTable
          changes={sortedChanges}
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

// ---------------------------------------------------------------------------
// ChangesTable
// ---------------------------------------------------------------------------

interface ChangesTableProps {
  changes: ParsedChange[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  sortColumn: ChangeSortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: ChangeSortColumn) => void;
}

function ChangesTable({
  changes,
  expandedItems,
  onToggle,
  sortColumn,
  sortDirection,
  onSort,
}: ChangesTableProps) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Table className="min-w-[640px]">
        <TableHeader>
          <HeaderRow>
            <SortableHeader
              label="Address / Handle"
              column="address"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="w-[25%]"
              tooltip="Where the data is stored: account/object address or table handle"
            />
            <SortableHeader
              label="Type"
              column="type"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="w-[15%]"
            />
            <SortableHeader
              label="Resource / Module"
              column="resource"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="w-[50%]"
              tooltip="Which module defines this data structure. Click to view module source code"
            />
            <TableHead className="w-[10%] text-center">Data</TableHead>
          </HeaderRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => (
            <ChangeRow
              key={change.id}
              change={change}
              isExpanded={expandedItems.has(change.id)}
              onToggle={() => onToggle(change.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChangeRow
// ---------------------------------------------------------------------------

interface ChangeRowProps {
  change: ParsedChange;
  isExpanded: boolean;
  onToggle: () => void;
}

function ChangeRow({ change, isExpanded, onToggle }: ChangeRowProps) {
  const meta = CHANGE_TYPE_META[change.type];

  return (
    <>
      <TableRow
        className="hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-12 cursor-pointer"
        onClick={onToggle}
      >
        {/* Address / Handle */}
        <TableCell>
          {change.address ? (
            <CopyableAddress
              address={change.address}
              href={`/account/${change.address}`}
              truncateLength={{ start: 6, end: 4 }}
            />
          ) : change.handle ? (
            <CopyableAddress
              address={change.handle}
              truncateLength={{ start: 6, end: 4 }}
              variant="hash"
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Type Badge */}
        <TableCell>
          {/* <Badge
            variant={meta.badgeVariant}
            className="text-xs"
          >
            {meta.label}
          </Badge> */}
          <span className="text-sm text-foreground">
            {meta.label}
          </span>
        </TableCell>

        {/* Resource / Module */}
        <TableCell>
          {change.moduleLink ? (
            <ResourceModuleLink
              rawType={change.resourceType || change.displayName}
              displayName={change.displayName}
              href={change.moduleLink}
            />
          ) : (
            <span className="font-mono text-sm text-foreground">
              {change.displayName}
            </span>
          )}
        </TableCell>

        {/* Expand Toggle */}
        <TableCell className="text-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground inline-block" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <TableRow className="hover:bg-transparent border-b border-border/30">
          <TableCell colSpan={4} className="p-0">
            <ChangeDetail change={change} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ResourceModuleLink (navigable resource/module with tooltip)
// ---------------------------------------------------------------------------

function ResourceModuleLink({
  rawType,
  displayName,
  href,
}: {
  rawType: string;
  displayName: string;
  href: string;
}) {
  const parsed = parseModuleParts(rawType);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className="font-mono text-sm text-primary hover:bg-primary/10 rounded-md px-1 py-0.5 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {displayName}
          </Link>
        </TooltipTrigger>
        {parsed && (
          <TooltipContent className="p-3 max-w-80 sm:max-w-100">
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                  Address
                </span>
                <div className="font-mono text-xs text-white break-all bg-muted/30 p-2 rounded border border-border/50 leading-relaxed">
                  {parsed.addr}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                  Module
                </span>
                <div className="font-mono text-xs text-foreground bg-muted/30 p-2 rounded border border-border/50 break-all whitespace-pre-wrap">
                  {formatMovementPath(parsed.moduleName)}
                </div>
              </div>
              {parsed.structName && (
                <div className="space-y-1">
                  <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                    Struct
                  </span>
                  <div className="font-mono text-xs text-guild-green-500 font-medium bg-primary/5 p-2 rounded border border-primary/10 break-all whitespace-pre-wrap">
                    {formatMovementPath(parsed.structName)}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// ChangeDetail (expanded content)
// ---------------------------------------------------------------------------

function ChangeDetail({ change }: { change: ParsedChange }) {
  return (
    <div className="bg-muted/20 px-6 py-4 space-y-3">
      {/* Metadata grid */}
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs items-baseline">
        {change.handle ? (
          <>
            <span className="text-muted-foreground whitespace-nowrap">
              Handle
            </span>
            <span>
              <CopyableAddress
                address={change.handle}
                truncateLength={{ start: 10, end: 8 }}
                variant="hash"
              />
            </span>
          </>
        ) : null}
        {change.tableKey ? (
          <>
            <span className="text-muted-foreground whitespace-nowrap">
              Key
            </span>
            <span className="font-mono break-all max-h-16 overflow-auto">
              {change.tableKey}
            </span>
          </>
        ) : null}
        {change.value ? (
          <>
            <span className="text-muted-foreground whitespace-nowrap">
              Value
            </span>
            <span className="font-mono break-all max-h-16 overflow-auto">
              {change.value}
            </span>
          </>
        ) : null}
      </div>

      {/* Data */}
      {change.data != null && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5 font-medium">
            Data
          </div>
          <div className="max-h-80 overflow-auto rounded-lg">
            <JsonViewer data={change.data} initialDepth={1} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import JsonViewer from "@/components/ui/json-viewer";
import { EmptyState } from "..";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  SortableHeader,
  type SortDirection,
} from "@/components/ui/sortable-header";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Table2,
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

interface ParsedResource {
  id: string;
  address: string;
  moduleName: string;
  structName: string;
  displayName: string;
  rawType: string;
  moduleLink: string | null;
  data: unknown;
}

interface ResourcesTabProps {
  resources: Types.MoveResource[] | undefined;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(addr: string): string {
  if (addr.length <= 6) return addr;
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

function buildModuleLink(typeOrModuleId: string): string | null {
  const parts = typeOrModuleId.split("::");
  if (parts.length >= 2) {
    const addr = parts[0];
    const modName = parts[1];
    return `/account/${addr}/modules/code/${modName}`;
  }
  return null;
}

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

function parseResources(resources: Types.MoveResource[]): ParsedResource[] {
  return resources.map((resource, index) => {
    const parts = resource.type.split("::");
    const address = parts[0] || "";
    const moduleName = parts[1] || "";
    const structName =
      parts.length >= 3 ? parts.slice(2).join("::") : "";
    const displayName = formatResourceType(resource.type);
    const moduleLink = buildModuleLink(resource.type);

    return {
      id: `resource-${index}`,
      address,
      moduleName,
      structName,
      displayName,
      rawType: resource.type,
      moduleLink,
      data: resource.data,
    };
  });
}

// ---------------------------------------------------------------------------
// ResourcesTab (main export)
// ---------------------------------------------------------------------------

type ResourceSortColumn = "address" | "module" | "resource";

export default function ResourcesTab({
  resources,
  isLoading,
}: ResourcesTabProps) {
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<ResourceSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const parsedResources = useMemo(
    () => (resources ? parseResources(resources) : []),
    [resources],
  );

  const sortedResources = useMemo(() => {
    if (!sortColumn) return parsedResources;

    const keyMap: Record<ResourceSortColumn, keyof ParsedResource> = {
      address: "address",
      module: "moduleName",
      resource: "structName",
    };
    const key = keyMap[sortColumn];

    return [...parsedResources].sort((a, b) => {
      const cmp = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [parsedResources, sortColumn, sortDirection]);

  const handleSort = (column: ResourceSortColumn) => {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ToggleGroup value="table" disabled>
          <ToggleGroupItem value="table">
            <Table2 className="h-3.5 w-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="raw">RAW</ToggleGroupItem>
        </ToggleGroup>

        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Table className="min-w-[640px]">
            <TableHeader>
              <HeaderRow>
                <TableHead className="w-[20%]">Address</TableHead>
                <TableHead className="w-[15%]">Module</TableHead>
                <TableHead className="w-[55%]">Resource</TableHead>
                <TableHead className="w-[10%] text-center">Data</TableHead>
              </HeaderRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/30 h-12">
                  <TableCell>
                    <EnhancedSkeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <EnhancedSkeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <EnhancedSkeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="text-center">
                    <EnhancedSkeleton className="h-4 w-4 mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <EmptyState
        icon={<Database className="h-12 w-12" />}
        title="No Resources Found"
        description="This account doesn't have any on-chain resources."
      />
    );
  }

  return (
    <div className="space-y-4">
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
        <JsonViewer data={resources} initialDepth={2} />
      ) : (
        <ResourcesTable
          resources={sortedResources}
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
// ResourcesTable
// ---------------------------------------------------------------------------

interface ResourcesTableProps {
  resources: ParsedResource[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  sortColumn: ResourceSortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: ResourceSortColumn) => void;
}

function ResourcesTable({
  resources,
  expandedItems,
  onToggle,
  sortColumn,
  sortDirection,
  onSort,
}: ResourcesTableProps) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Table className="min-w-[640px]">
        <TableHeader>
          <HeaderRow>
            <SortableHeader
              label="Address"
              column="address"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="w-[20%]"
              tooltip="Account address that owns this resource"
            />
            <SortableHeader
              label="Module"
              column="module"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="w-[15%]"
            />
            <SortableHeader
              label="Resource"
              column="resource"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="w-[55%]"
              tooltip="Which module defines this data structure. Click to view module source code"
            />
            <TableHead className="w-[10%] text-center">Data</TableHead>
          </HeaderRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              isExpanded={expandedItems.has(resource.id)}
              onToggle={() => onToggle(resource.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResourceRow
// ---------------------------------------------------------------------------

interface ResourceRowProps {
  resource: ParsedResource;
  isExpanded: boolean;
  onToggle: () => void;
}

function ResourceRow({ resource, isExpanded, onToggle }: ResourceRowProps) {
  return (
    <>
      <TableRow
        className="hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-12 cursor-pointer"
        onClick={onToggle}
      >
        {/* Address */}
        <TableCell>
          <CopyableAddress
            address={resource.address}
            href={`/account/${resource.address}`}
            truncateLength={{ start: 6, end: 4 }}
          />
        </TableCell>

        {/* Module */}
        <TableCell>
          <span className="text-sm text-foreground">
            {formatMovementPath(resource.moduleName)}
          </span>
        </TableCell>

        {/* Resource */}
        <TableCell>
          {resource.moduleLink ? (
            <ResourceModuleLink
              rawType={resource.rawType}
              displayName={resource.displayName}
              href={resource.moduleLink}
            />
          ) : (
            <span className="font-mono text-sm text-foreground">
              {resource.displayName}
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
            <ResourceDetail resource={resource} />
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
// ResourceDetail (expanded content)
// ---------------------------------------------------------------------------

function ResourceDetail({ resource }: { resource: ParsedResource }) {
  return (
    <div className="bg-muted/20 px-6 py-4">
      {resource.data != null && (
        <div className="max-h-80 overflow-auto rounded-lg">
          <JsonViewer data={resource.data} initialDepth={1} />
        </div>
      )}
    </div>
  );
}

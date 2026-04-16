"use client";

import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";

interface EventDataViewProps {
  data: unknown;
  className?: string;
  /** Internal: current nesting depth. Falls back to JsonViewer when exceeding max. */
  depth?: number;
}

const MAX_DEPTH = 2;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isPrimitive(v: unknown): boolean {
  return v === null || v === undefined || typeof v !== "object";
}

/**
 * Check if value looks like a Move address (0x hex string, 1-64 hex chars after prefix)
 */
function isAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^0x[0-9a-fA-F]{1,64}$/.test(value);
}

/**
 * Detect resource data pattern: { type: string, data: object }
 */
function isResourceData(
  obj: Record<string, unknown>
): obj is { type: string; data: Record<string, unknown> } {
  return (
    typeof obj.type === "string" &&
    isPlainObject(obj.data) &&
    Object.keys(obj).length === 2
  );
}

function renderValue(value: unknown) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-emerald-400" : "text-rose-400"}>
        {String(value)}
      </span>
    );
  }
  if (isAddress(value)) {
    return (
      <CopyableAddress
        address={value}
        href={`/account/${value}`}
        truncateLength={{ start: 10, end: 8 }}
      />
    );
  }
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      return (
        <span className="font-mono text-foreground">
          {Number(value).toLocaleString()}
        </span>
      );
    }
    return (
      <span className="font-mono text-foreground break-all">{value}</span>
    );
  }
  if (typeof value === "number") {
    return (
      <span className="font-mono text-foreground">
        {value.toLocaleString()}
      </span>
    );
  }
  // Nested object/array — inline JsonViewer, no recursive table
  return <JsonViewer data={value} initialDepth={1} />;
}

function KeyValueRows({
  entries,
  depth,
}: {
  entries: [string, unknown][];
  depth: number;
}) {
  return (
    <>
      {entries.map(([key, value]) => {
        if (isPrimitive(value)) {
          return (
            <div
              key={key}
              className="grid grid-cols-[180px_1fr] gap-4 py-3 items-baseline rounded-sm transition-colors hover:bg-muted/30"
            >
              <span className="text-sm text-muted-foreground font-medium font-mono break-all">
                {key}
              </span>
              <div className="text-sm">{renderValue(value)}</div>
            </div>
          );
        }
        // Nested object/array — render key as a sub-section header, value as nested EventDataView
        return (
          <div key={key} className="py-3 rounded-sm transition-colors hover:bg-muted/30">
            <span className="text-sm text-muted-foreground font-medium font-mono">
              {key}
            </span>
            <div className="mt-1.5 pl-4 border-l-2 border-border/30">
              <EventDataView data={value} depth={depth + 1} />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function EventDataView({ data, className, depth = 0 }: EventDataViewProps) {
  // Not an object or exceeded max depth — fall back to JSON viewer
  if (!isPlainObject(data) || depth > MAX_DEPTH) {
    return <JsonViewer data={data} initialDepth={1} className={className} />;
  }

  const obj = data as Record<string, unknown>;
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return <JsonViewer data={data} initialDepth={1} className={className} />;
  }

  // Resource pattern: { type: "0x1::module::Struct", data: { ... } }
  // Unwrap and render the inner data with the type as a header
  if (isResourceData(obj)) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="font-mono text-xs text-muted-foreground break-all">
          {obj.type}
        </div>
        <div className="divide-y divide-border/10">
          <KeyValueRows
            entries={Object.entries(obj.data as Record<string, unknown>)}
            depth={depth + 1}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-border/10", className)}>
      <KeyValueRows entries={entries} depth={depth} />
    </div>
  );
}

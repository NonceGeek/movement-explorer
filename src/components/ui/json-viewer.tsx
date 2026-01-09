"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Copy, Check, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  /** Initial depth to expand (default: 2) */
  initialDepth?: number;
  className?: string;
}

interface JsonNodeProps {
  name: string | number | null;
  value: unknown;
  depth: number;
  initialDepth: number;
  isLast: boolean;
}

function CopyButton({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const text =
          typeof value === "string" ? value : JSON.stringify(value, null, 2);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    [value]
  );

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover/node:opacity-100 p-1 rounded hover:bg-muted transition-all ml-1 cursor-pointer"
      title="Copy value"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}

function JsonNode({ name, value, depth, initialDepth, isLast }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < initialDepth);

  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value as object).length === 0;

  const entries = isObject ? Object.entries(value as object) : [];

  const renderValue = () => {
    if (value === null)
      return <span className="text-muted-foreground italic">null</span>;
    if (value === undefined)
      return <span className="text-muted-foreground italic">undefined</span>;
    if (typeof value === "boolean")
      return <span className="text-yellow-500">{String(value)}</span>;
    if (typeof value === "number")
      return <span className="text-blue-400">{value}</span>;
    if (typeof value === "string") {
      // Truncate long strings
      const display = value.length > 100 ? value.slice(0, 100) + "..." : value;
      return <span className="text-green-400">"{display}"</span>;
    }
    return <span>{String(value)}</span>;
  };

  const comma = !isLast ? (
    <span className="text-muted-foreground">,</span>
  ) : null;

  if (!isObject) {
    return (
      <div className="group/node flex items-center py-0.5 hover:bg-muted/30 rounded px-1 -mx-1">
        <span className="w-4 h-4 shrink-0"></span>
        {name !== null && (
          <>
            <span className="text-primary">"{name}"</span>
            <span className="text-muted-foreground mx-1">:</span>
          </>
        )}
        {renderValue()}
        {comma}
        <CopyButton value={value} />
      </div>
    );
  }

  const bracket = isArray ? ["[", "]"] : ["{", "}"];

  if (isEmpty) {
    return (
      <div className="group/node flex items-center py-0.5 hover:bg-muted/30 rounded px-1 -mx-1">
        <span className="w-4 h-4 shrink-0"></span>
        {name !== null && (
          <>
            <span className="text-primary">"{name}"</span>
            <span className="text-muted-foreground mx-1">:</span>
          </>
        )}
        <span className="text-muted-foreground">
          {bracket[0]}
          {bracket[1]}
        </span>
        {comma}
        <CopyButton value={value} />
      </div>
    );
  }

  return (
    <div className="py-0.5">
      <div
        className="group/node flex items-center cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
        {name !== null && (
          <>
            <span className="text-primary">"{name}"</span>
            <span className="text-muted-foreground mx-1">:</span>
          </>
        )}
        <span className="text-muted-foreground">{bracket[0]}</span>
        {!isExpanded && (
          <>
            <span className="text-muted-foreground mx-1">
              {entries.length} {entries.length === 1 ? "item" : "items"}
            </span>
            <span className="text-muted-foreground">{bracket[1]}</span>
            {comma}
          </>
        )}
        <CopyButton value={value} />
      </div>
      {isExpanded && (
        <>
          <div className="ml-4 pl-2 border-l border-border/50">
            {entries.map(([key, val], idx) => (
              <JsonNode
                key={key}
                name={isArray ? idx : key}
                value={val}
                depth={depth + 1}
                initialDepth={initialDepth}
                isLast={idx === entries.length - 1}
              />
            ))}
          </div>
          <div className="inline-flex items-center">
            <span className="w-4"></span>
            <span className="text-muted-foreground">{bracket[1]}</span>
            {comma}
          </div>
        </>
      )}
    </div>
  );
}

export function JsonViewer({
  data,
  initialDepth = 2,
  className,
}: JsonViewerProps) {
  return (
    <div
      className={cn(
        "bg-muted/30 rounded-lg p-4 overflow-x-auto font-mono text-sm",
        className
      )}
    >
      <JsonNode
        name={null}
        value={data}
        depth={0}
        initialDepth={initialDepth}
        isLast={true}
      />
    </div>
  );
}

export default JsonViewer;

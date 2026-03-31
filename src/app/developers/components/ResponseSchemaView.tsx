"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/utils/styling";
import type { ResponseObject, SchemaObject } from "@/types/openapi";

const TYPE_COLORS: Record<string, string> = {
  string: "text-[var(--color-moveus-marigold-400)]",
  integer: "text-[var(--color-oracle-orange-400)]",
  number: "text-[var(--color-oracle-orange-400)]",
  boolean: "text-[var(--color-guild-green-300)]",
  array: "text-[var(--color-protocol-pink-300)]",
  object: "text-[var(--color-byzantine-blue-200)]",
};

const STATUS_COLORS: Record<string, string> = {
  "2": "text-green-600",
  "3": "text-yellow-600",
  "4": "text-red-500",
  "5": "text-red-600",
};

function statusColor(code: string): string {
  return STATUS_COLORS[code[0]] ?? "text-muted-foreground";
}

function typeLabel(schema: SchemaObject): string {
  if (schema.type === "array" && schema.items?.type) {
    return `array[${schema.items.type}]`;
  }
  if (schema.type === "array" && schema.items) {
    return "array[object]";
  }
  return schema.type ?? "object";
}

/** Renders a single schema property row */
function SchemaPropertyRow({
  name,
  schema,
  required,
  depth,
}: {
  name: string;
  schema: SchemaObject;
  required: boolean;
  depth: number;
}) {
  const hasChildren =
    schema.properties ||
    (schema.type === "array" && schema.items?.properties) ||
    schema.oneOf;
  const [isOpen, setIsOpen] = useState(false);

  const childSchema =
    schema.type === "array" && schema.items?.properties
      ? schema.items
      : schema;

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-2 py-1.5 text-sm",
          hasChildren && "cursor-pointer hover:bg-muted/30 rounded-sm -mx-1 px-1",
        )}
        onClick={hasChildren ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="font-mono font-medium">{name}</span>
          {required && <span className="text-red-500 text-xs">*</span>}
        </div>
        <span
          className={cn(
            "text-xs shrink-0",
            TYPE_COLORS[schema.type ?? "object"] ?? "text-muted-foreground/50",
          )}
        >
          {typeLabel(schema)}
          {schema.format && (
            <span className="text-muted-foreground/50 ml-1">
              ({schema.format})
            </span>
          )}
        </span>
        {schema.description && (
          <span className="text-xs text-muted-foreground truncate">
            {schema.description}
          </span>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="border-l-2 border-border/50 ml-2 pl-3">
          <SchemaTree
            schema={childSchema}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}

/** Recursively renders schema properties as a tree */
function SchemaTree({
  schema,
  depth = 0,
}: {
  schema: SchemaObject;
  depth?: number;
}) {
  if (depth > 8) return <span className="text-xs text-muted-foreground">...</span>;

  if (schema.oneOf) {
    return (
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground italic">One of:</span>
        {schema.oneOf.map((variant, i) => {
          const label =
            variant.properties?.[schema.discriminator?.propertyName ?? "type"]?.enum?.[0] ??
            `Variant ${i + 1}`;
          return (
            <div key={i} className="border-l-2 border-border/30 pl-3">
              <span className="text-xs font-mono text-muted-foreground">{label}</span>
              <SchemaTree schema={variant} depth={depth + 1} />
            </div>
          );
        })}
      </div>
    );
  }

  const properties = schema.properties;
  if (!properties) {
    return (
      <span className={cn("text-xs", TYPE_COLORS[schema.type ?? ""] ?? "text-muted-foreground")}>
        {typeLabel(schema)}
      </span>
    );
  }

  const requiredSet = new Set(schema.required ?? []);

  return (
    <div className="space-y-0.5">
      {Object.entries(properties).map(([key, prop]) => (
        <SchemaPropertyRow
          key={key}
          name={key}
          schema={prop}
          required={requiredSet.has(key)}
          depth={depth}
        />
      ))}
    </div>
  );
}

interface ResponseSchemaViewProps {
  responses: Record<string, ResponseObject>;
}

export default function ResponseSchemaView({ responses }: ResponseSchemaViewProps) {
  const codes = Object.keys(responses).sort();
  if (codes.length === 0) return null;

  const [isOpen, setIsOpen] = useState(false);
  const defaultCode = codes.find((c) => c.startsWith("2")) ?? codes[0];

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-semibold cursor-pointer hover:text-foreground/80 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        Response Schema
      </button>

      {isOpen && (
        <div className="mt-3">
          <Tabs defaultValue={defaultCode}>
            <TabsList variant="pill" className="gap-1.5 mb-3">
              {codes.map((code) => (
                <TabsTrigger
                  key={code}
                  value={code}
                  variant="pill"
                  className={cn("text-xs px-3 py-1.5 font-mono", statusColor(code))}
                >
                  {code}
                </TabsTrigger>
              ))}
            </TabsList>

            {codes.map((code) => {
              const resp = responses[code];
              const schema =
                resp.content?.["application/json"]?.schema;

              return (
                <TabsContent key={code} value={code} className="mt-0">
                  {resp.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {resp.description}
                    </p>
                  )}
                  {schema ? (
                    <div className="rounded-md border border-border/30 bg-muted/20 p-3">
                      <SchemaTree schema={schema} />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No schema defined
                    </p>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </div>
  );
}

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
    schema.oneOf ||
    schema.anyOf;
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

/** Expandable variant row for object/array variants in oneOf/anyOf */
function VariantRow({
  label,
  variant,
  depth,
}: {
  label: string | null;
  variant: SchemaObject;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const variantType = variant.type ?? "object";
  const displayLabel = label ?? typeLabel(variant);

  return (
    <div className="border-l-2 border-border/30 pl-3">
      <div
        className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-muted/30 rounded-sm -mx-1 px-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-mono font-medium">{displayLabel}</span>
        <span
          className={cn(
            "text-xs",
            TYPE_COLORS[variantType] ?? "text-muted-foreground/50",
          )}
        >
          {variantType}
        </span>
        {variant.description && (
          <span className="text-xs text-muted-foreground truncate">
            {variant.description}
          </span>
        )}
      </div>
      {isOpen && (
        <div className="border-l-2 border-border/50 ml-2 pl-3">
          <SchemaTree schema={variant} depth={depth + 1} />
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

  // Top-level array: unwrap and render item schema
  if (schema.type === "array" && schema.items) {
    const itemSchema = schema.items;
    const hasItemProperties = itemSchema.properties || itemSchema.oneOf || itemSchema.anyOf;
    if (hasItemProperties) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("font-mono", TYPE_COLORS.array)}>array</span>
            <span>of</span>
          </div>
          <div className="border-l-2 border-border/50 pl-3">
            <SchemaTree schema={itemSchema} depth={depth + 1} />
          </div>
        </div>
      );
    }
    return (
      <span className={cn("text-xs", TYPE_COLORS.array)}>
        {typeLabel(schema)}
      </span>
    );
  }

  const variants = schema.oneOf ?? schema.anyOf;
  if (variants) {
    const variantLabel = schema.oneOf ? "One of:" : "Any of:";
    return (
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground italic">{variantLabel}</span>
        {variants.map((variant, i) => {
          const isPrimitive =
            !variant.properties && !variant.oneOf && !variant.anyOf && !variant.allOf;
          const variantType = variant.type ?? "object";

          // For primitives, just show the type with color — no recursion needed
          if (isPrimitive && !variant.items?.properties) {
            const displayType = typeLabel(variant);
            return (
              <div key={i} className="border-l-2 border-border/30 pl-3 py-0.5">
                <span
                  className={cn(
                    "text-xs font-mono",
                    TYPE_COLORS[variantType] ?? "text-muted-foreground",
                  )}
                >
                  {displayType}
                </span>
                {variant.format && (
                  <span className="text-xs text-muted-foreground/50 ml-1">
                    ({variant.format})
                  </span>
                )}
                {variant.description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {variant.description}
                  </span>
                )}
              </div>
            );
          }

          // For objects/arrays with properties, show a meaningful label + expandable tree
          const label =
            variant.title ??
            variant.properties?.[schema.discriminator?.propertyName ?? "type"]?.enum?.[0] ??
            null;

          return (
            <VariantRow
              key={i}
              label={label}
              variant={variant}
              depth={depth}
            />
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
      {schema.description && depth === 0 && (
        <p className="text-xs text-muted-foreground mb-2">{schema.description}</p>
      )}
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

  const defaultCode = codes.find((c) => c.startsWith("2")) ?? codes[0];

  return (
    <div className="border-t border-border/40 pt-4">
      <div className="text-sm font-semibold">
        Response Schema
      </div>

      <div className="mt-3">
        <Tabs defaultValue={defaultCode}>
          <TabsList variant="pill" className="gap-1.5 mb-3">
            {codes.map((code) => (
              <TabsTrigger
                key={code}
                value={code}
                variant="pill"
                className={cn("text-xs px-3 py-1.5 font-mono flex-none", statusColor(code))}
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
    </div>
  );
}

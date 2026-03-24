"use client";

import { Fragment } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/styling";
import type { SchemaObject } from "@/types/openapi";

// Colors aligned with shiki JSON syntax highlighting tokens (same as ParameterForm)
const TYPE_COLORS: Record<string, string> = {
  string: "text-[var(--color-moveus-marigold-400)]",
  integer: "text-[var(--color-oracle-orange-400)]",
  number: "text-[var(--color-oracle-orange-400)]",
  boolean: "text-[var(--color-guild-green-300)]",
  array: "text-[var(--color-protocol-pink-300)]",
  object: "text-[var(--color-byzantine-blue-200)]",
};

/** Returns a sensible empty default for a given schema type. */
export function defaultForType(schema?: SchemaObject): unknown {
  if (!schema) return "";
  if (schema.type === "string") return schema.default ?? "";
  if (schema.type === "integer" || schema.type === "number")
    return schema.default ?? 0;
  if (schema.type === "boolean") return schema.default ?? false;
  if (schema.type === "array") return [];
  if (schema.type === "object" || schema.properties) {
    const obj: Record<string, unknown> = {};
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        obj[key] = defaultForType(prop);
      }
    }
    return obj;
  }
  return "";
}

/** Human-readable type label, e.g. "array[string]" */
function typeLabel(schema: SchemaObject): string {
  if (schema.type === "array" && schema.items?.type) {
    return `array[${schema.items.type}]`;
  }
  return schema.type ?? "object";
}

// ---------------------------------------------------------------------------
// Sub-components for each field type
// ---------------------------------------------------------------------------

function StringEnumField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function BooleanField({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <select
      value={String(value)}
      onChange={(e) => onChange(e.target.value === "true")}
      className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="false">false</option>
      <option value="true">true</option>
    </select>
  );
}

function ArrayField({
  schema,
  items,
  onChange,
}: {
  schema: SchemaObject;
  items: unknown[];
  onChange: (items: unknown[]) => void;
}) {
  const itemSchema = schema.items;
  const itemType = itemSchema?.type ?? "string";

  const addItem = () => {
    onChange([...items, defaultForType(itemSchema)]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: unknown) => {
    const next = [...items];
    next[index] = val;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          {itemType === "number" || itemType === "integer" ? (
            <Input
              type="number"
              value={String(item ?? "")}
              onChange={(e) => {
                const v = e.target.value;
                updateItem(
                  index,
                  itemType === "integer" ? parseInt(v, 10) || 0 : parseFloat(v) || 0,
                );
              }}
              className="font-mono text-sm flex-1"
            />
          ) : (
            <Input
              value={String(item ?? "")}
              onChange={(e) => updateItem(index, e.target.value)}
              className="font-mono text-sm flex-1"
              placeholder={`Item ${index + 1}`}
            />
          )}
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="cursor-pointer p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Remove item ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RequestBodyFormProps {
  schema: SchemaObject;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export default function RequestBodyForm({
  schema,
  value,
  onChange,
}: RequestBodyFormProps) {
  const properties = schema.properties;
  if (!properties) return null;

  const requiredSet = new Set(schema.required ?? []);

  const updateField = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...value, [fieldName]: fieldValue });
  };

  // Renders the input control for a single property
  const renderControl = (key: string, prop: SchemaObject) => {
    // string with enum -> dropdown
    if (prop.type === "string" && prop.enum) {
      return (
        <StringEnumField
          value={String(value[key] ?? "")}
          options={prop.enum}
          onChange={(v) => updateField(key, v)}
        />
      );
    }

    // boolean -> select true/false
    if (prop.type === "boolean") {
      return (
        <BooleanField
          value={Boolean(value[key] ?? false)}
          onChange={(v) => updateField(key, v)}
        />
      );
    }

    // array (primitive items) -> dynamic row list
    if (prop.type === "array") {
      const arr = Array.isArray(value[key]) ? (value[key] as unknown[]) : [];
      return (
        <ArrayField
          schema={prop}
          items={arr}
          onChange={(items) => updateField(key, items)}
        />
      );
    }

    // nested object -> recursive sub-form
    if (prop.type === "object" || prop.properties) {
      const nested =
        value[key] && typeof value[key] === "object" && !Array.isArray(value[key])
          ? (value[key] as Record<string, unknown>)
          : (defaultForType(prop) as Record<string, unknown>);
      return (
        <div className="border-l-2 border-border pl-4">
          <RequestBodyForm
            schema={prop}
            value={nested}
            onChange={(v) => updateField(key, v)}
          />
        </div>
      );
    }

    // integer / number
    if (prop.type === "integer" || prop.type === "number") {
      return (
        <Input
          type="number"
          placeholder={prop.description || key}
          value={value[key] !== undefined ? String(value[key]) : ""}
          onChange={(e) => {
            const v = e.target.value;
            updateField(
              key,
              prop.type === "integer"
                ? parseInt(v, 10) || 0
                : parseFloat(v) || 0,
            );
          }}
          className="font-mono text-sm"
        />
      );
    }

    // default: string text input
    return (
      <Input
        placeholder={prop.description || key}
        value={String(value[key] ?? "")}
        onChange={(e) => updateField(key, e.target.value)}
        className="font-mono text-sm"
      />
    );
  };

  const entries = Object.entries(properties);

  return (
    <>
      {/* Mobile: stacked layout */}
      <div className="md:hidden space-y-4">
        {entries.map(([key, prop]) => {
          const isRequired = requiredSet.has(key);
          return (
            <div key={key} className="space-y-1">
              <div>
                <span className="text-sm font-mono font-medium">{key}</span>
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                <span
                  className={cn(
                    "text-[11px] ml-2",
                    TYPE_COLORS[prop.type ?? "object"] ??
                      "text-muted-foreground/50",
                  )}
                >
                  {typeLabel(prop)}
                </span>
              </div>
              {prop.description && (
                <p className="text-xs text-muted-foreground">
                  {prop.description}
                </p>
              )}
              {renderControl(key, prop)}
            </div>
          );
        })}
      </div>

      {/* Desktop: grid layout matching ParameterForm */}
      <div className="hidden md:grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-start">
        {entries.map(([key, prop]) => {
          const isRequired = requiredSet.has(key);
          return (
            <Fragment key={key}>
              <div className="pt-2">
                <span className="text-sm font-mono font-medium whitespace-nowrap">
                  {key}
                </span>
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                <div
                  className={cn(
                    "text-[11px]",
                    TYPE_COLORS[prop.type ?? "object"] ??
                      "text-muted-foreground/50",
                  )}
                >
                  {typeLabel(prop)}
                </div>
              </div>
              <div className="pt-0.5">
                {renderControl(key, prop)}
                {prop.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {prop.description}
                  </p>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

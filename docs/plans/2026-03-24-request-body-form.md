# RequestBodyForm Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the raw JSON textarea for POST request bodies with a structured form that generates inputs from OpenAPI schema, matching `ParameterForm`'s visual style.

**Architecture:** New `RequestBodyForm` component recursively renders form fields from `SchemaObject`. It manages structured data (not JSON strings) and integrates into `EndpointCard` by replacing the textarea.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing `Input` / `Button` from `@/components/ui`, lucide-react icons.

---

### Task 1: Create `RequestBodyForm` component

**Files:**
- Create: `src/app/developers/components/RequestBodyForm.tsx`

**Step 1: Create the component file**

```tsx
"use client";

import { Fragment } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";
import { Plus, X } from "lucide-react";
import type { SchemaObject } from "@/types/openapi";

// Reuse the same color map as ParameterForm
const TYPE_COLORS: Record<string, string> = {
  string: "text-[var(--color-moveus-marigold-400)]",
  integer: "text-[var(--color-oracle-orange-400)]",
  number: "text-[var(--color-oracle-orange-400)]",
  boolean: "text-[var(--color-guild-green-300)]",
  array: "text-[var(--color-protocol-pink-300)]",
  object: "text-[var(--color-byzantine-blue-200)]",
};

interface RequestBodyFormProps {
  schema: SchemaObject;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/** Default value for a schema type */
function defaultForType(schema?: SchemaObject): unknown {
  if (!schema) return "";
  if (schema.type === "string") return schema.default ?? "";
  if (schema.type === "integer" || schema.type === "number") return schema.default ?? 0;
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

/** Render a single field based on its schema type */
function SchemaField({
  name,
  schema,
  value,
  onChange,
  required,
}: {
  name: string;
  schema: SchemaObject;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
}) {
  const type = schema.type ?? "string";
  const typeColor = TYPE_COLORS[type] ?? "text-muted-foreground/50";

  // Label row (shared across all types)
  const label = (
    <div className="pt-2">
      <span className="text-sm font-mono font-medium whitespace-nowrap">
        {name}
      </span>
      {required && <span className="text-red-500 ml-1">*</span>}
      <div className={cn("text-[11px]", typeColor)}>
        {type}
        {type === "array" && schema.items?.type ? `[${schema.items.type}]` : ""}
      </div>
    </div>
  );

  // --- Boolean ---
  if (type === "boolean") {
    return (
      <Fragment>
        {label}
        <div className="pt-2">
          <select
            value={String(value ?? false)}
            onChange={(e) => onChange(e.target.value === "true")}
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
          {schema.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {schema.description}
            </p>
          )}
        </div>
      </Fragment>
    );
  }

  // --- Enum ---
  if (schema.enum) {
    return (
      <Fragment>
        {label}
        <div className="pt-0.5">
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {schema.enum.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {schema.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {schema.description}
            </p>
          )}
        </div>
      </Fragment>
    );
  }

  // --- Array ---
  if (type === "array") {
    const items = Array.isArray(value) ? (value as unknown[]) : [];
    const itemDefault = defaultForType(schema.items);

    const updateItem = (index: number, val: unknown) => {
      const next = [...items];
      next[index] = val;
      onChange(next);
    };
    const addItem = () => onChange([...items, itemDefault]);
    const removeItem = (index: number) => {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
    };

    return (
      <Fragment>
        {label}
        <div className="pt-0.5 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={schema.items?.description || `Item ${index + 1}`}
                value={String(item ?? "")}
                onChange={(e) => updateItem(index, e.target.value)}
                className="font-mono text-sm flex-1"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-muted-foreground hover:text-red-500 transition-colors px-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Add item
          </button>
          {schema.description && (
            <p className="text-xs text-muted-foreground">
              {schema.description}
            </p>
          )}
        </div>
      </Fragment>
    );
  }

  // --- Nested object ---
  if (type === "object" || schema.properties) {
    const objValue = (value && typeof value === "object" && !Array.isArray(value))
      ? (value as Record<string, unknown>)
      : {};
    return (
      <Fragment>
        {label}
        <div className="pt-0.5 border-l-2 border-border/50 pl-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-start">
            {schema.properties &&
              Object.entries(schema.properties).map(([key, prop]) => (
                <SchemaField
                  key={key}
                  name={key}
                  schema={prop}
                  value={objValue[key]}
                  onChange={(v) => {
                    onChange({ ...objValue, [key]: v });
                  }}
                  required={schema.required?.includes(key)}
                />
              ))}
          </div>
        </div>
      </Fragment>
    );
  }

  // --- String / number / integer (default) ---
  return (
    <Fragment>
      {label}
      <div className="pt-0.5">
        <Input
          type={type === "integer" || type === "number" ? "number" : "text"}
          placeholder={schema.description || name}
          value={String(value ?? "")}
          onChange={(e) => {
            if (type === "integer") onChange(parseInt(e.target.value, 10) || 0);
            else if (type === "number") onChange(parseFloat(e.target.value) || 0);
            else onChange(e.target.value);
          }}
          className="font-mono text-sm"
        />
        {schema.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {schema.description}
          </p>
        )}
      </div>
    </Fragment>
  );
}

export default function RequestBodyForm({
  schema,
  value,
  onChange,
}: RequestBodyFormProps) {
  if (!schema.properties) return null;

  return (
    <>
      {/* Mobile: stacked layout */}
      <div className="md:hidden space-y-3">
        {Object.entries(schema.properties).map(([key, prop]) => {
          const type = prop.type ?? "string";
          const typeColor = TYPE_COLORS[type] ?? "text-muted-foreground/50";
          const isRequired = schema.required?.includes(key);

          // For arrays: inline rendering
          if (type === "array") {
            const items = Array.isArray(value[key]) ? (value[key] as unknown[]) : [];
            const itemDefault = defaultForType(prop.items);
            return (
              <div key={key} className="space-y-1">
                <div>
                  <span className="text-sm font-mono font-medium">{key}</span>
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                  <span className={cn("text-[11px] ml-2", typeColor)}>
                    {type}{prop.items?.type ? `[${prop.items.type}]` : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={prop.items?.description || `Item ${index + 1}`}
                        value={String(item ?? "")}
                        onChange={(e) => {
                          const next = [...items];
                          next[index] = e.target.value;
                          onChange({ ...value, [key]: next });
                        }}
                        className="font-mono text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ ...value, [key]: items.filter((_, i) => i !== index) });
                        }}
                        className="text-muted-foreground hover:text-red-500 transition-colors px-1 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, [key]: [...items, itemDefault] })}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    Add item
                  </button>
                </div>
                {prop.description && (
                  <p className="text-xs text-muted-foreground">{prop.description}</p>
                )}
              </div>
            );
          }

          // For boolean
          if (type === "boolean") {
            return (
              <div key={key} className="space-y-1">
                <div>
                  <span className="text-sm font-mono font-medium">{key}</span>
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                  <span className={cn("text-[11px] ml-2", typeColor)}>{type}</span>
                </div>
                <select
                  value={String(value[key] ?? false)}
                  onChange={(e) => onChange({ ...value, [key]: e.target.value === "true" })}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
                {prop.description && (
                  <p className="text-xs text-muted-foreground">{prop.description}</p>
                )}
              </div>
            );
          }

          // For string / number / integer
          return (
            <div key={key} className="space-y-1">
              <div>
                <span className="text-sm font-mono font-medium">{key}</span>
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                <span className={cn("text-[11px] ml-2", typeColor)}>{type}</span>
              </div>
              <Input
                type={type === "integer" || type === "number" ? "number" : "text"}
                placeholder={prop.description || key}
                value={String(value[key] ?? "")}
                onChange={(e) => {
                  let val: unknown = e.target.value;
                  if (type === "integer") val = parseInt(e.target.value, 10) || 0;
                  else if (type === "number") val = parseFloat(e.target.value) || 0;
                  onChange({ ...value, [key]: val });
                }}
                className="font-mono text-sm"
              />
              {prop.description && (
                <p className="text-xs text-muted-foreground">{prop.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: grid layout matching ParameterForm */}
      <div className="hidden md:grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-start">
        {Object.entries(schema.properties).map(([key, prop]) => (
          <SchemaField
            key={key}
            name={key}
            schema={prop}
            value={value[key]}
            onChange={(v) => onChange({ ...value, [key]: v })}
            required={schema.required?.includes(key)}
          />
        ))}
      </div>
    </>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm build 2>&1 | head -30`
Expected: No TypeScript errors in `RequestBodyForm.tsx`

**Step 3: Commit**

```bash
git add src/app/developers/components/RequestBodyForm.tsx
git commit -m "feat(developers): add RequestBodyForm component for structured POST body editing"
```

---

### Task 2: Integrate `RequestBodyForm` into `EndpointCard`

**Files:**
- Modify: `src/app/developers/components/EndpointCard.tsx`

**Step 1: Update imports and state**

In `EndpointCard.tsx`, add the import for `RequestBodyForm` and change the body state from a JSON string to a structured object.

Changes:
1. Add import: `import RequestBodyForm from "./RequestBodyForm";`
2. Replace `bodyText` state with `bodyValue` state:
   - Old (lines 48-50):
     ```tsx
     const [bodyText, setBodyText] = useState<string>(() =>
       bodySchema ? JSON.stringify(schemaToTemplate(bodySchema), null, 2) : ""
     );
     ```
   - New:
     ```tsx
     const [bodyValue, setBodyValue] = useState<Record<string, unknown>>(() =>
       bodySchema ? (schemaToTemplate(bodySchema) as Record<string, unknown>) : {}
     );
     ```

3. Replace the textarea block (lines 149-161) with `RequestBodyForm`:
   - Old:
     ```tsx
     {bodySchema && (
       <div>
         <h4 className="text-sm font-semibold mb-3">Request Body</h4>
         <textarea
           value={bodyText}
           onChange={(e) => setBodyText(e.target.value)}
           rows={Math.min(Math.max(bodyText.split("\n").length, 4), 16)}
           className="w-full rounded-md border border-border bg-muted/30 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
           spellCheck={false}
         />
       </div>
     )}
     ```
   - New:
     ```tsx
     {bodySchema && (
       <div>
         <h4 className="text-sm font-semibold mb-3">Request Body</h4>
         <RequestBodyForm
           schema={bodySchema}
           value={bodyValue}
           onChange={setBodyValue}
         />
       </div>
     )}
     ```

4. Update the body prop passed to `RequestRunner` (line 173):
   - Old:
     ```tsx
     body={bodySchema ? (() => { try { return JSON.parse(bodyText); } catch { return undefined; } })() : undefined}
     ```
   - New:
     ```tsx
     body={bodySchema ? bodyValue : undefined}
     ```

**Step 2: Verify it compiles and renders**

Run: `pnpm build 2>&1 | head -30`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/developers/components/EndpointCard.tsx
git commit -m "feat(developers): integrate RequestBodyForm into EndpointCard, replacing textarea"
```

---

### Task 3: Visual verification

**Step 1: Start dev server and test**

Run: `pnpm dev`

1. Navigate to the developers API page
2. Find a POST endpoint (e.g. `/v1/view`)
3. Expand it and verify:
   - `function` field renders as a text input with "string" type label
   - `type_arguments` field renders as a dynamic array with +/- buttons
   - `arguments` field renders as a dynamic array with +/- buttons
   - Adding/removing array items works
   - Clicking "Send Request" sends the structured data correctly
   - Mobile layout stacks fields vertically
   - Desktop layout uses the grid matching ParameterForm style

**Step 2: Fix any visual issues found**

**Step 3: Final commit if any fixes needed**

```bash
git add -u
git commit -m "fix(developers): polish RequestBodyForm styling"
```

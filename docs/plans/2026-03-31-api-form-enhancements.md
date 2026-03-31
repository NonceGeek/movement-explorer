# API Form Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the API developer portal with pill-tab enum selectors, pre-filled examples, response schema docs, Ajv validation, and header parameter support.

**Architecture:** Incremental improvements to existing components. New `ResponseSchemaView` component for response docs, new `useSchemaValidation` hook wrapping Ajv. All changes reuse the existing design system (PillTabsList, TYPE_COLORS, etc.). The OpenAPI spec parser (`useOpenApiSpec.ts`) is extended to resolve response schema `$ref`s and preserve `example` fields through `allOf` merging.

**Tech Stack:** React 19, TypeScript, Ajv + ajv-formats, Radix UI Tabs (existing), TanStack Query (existing)

---

### Task 1: Install Ajv dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install ajv and ajv-formats**

Run: `pnpm add ajv ajv-formats`

**Step 2: Verify installation**

Run: `pnpm ls ajv ajv-formats`
Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add ajv and ajv-formats for schema validation"
```

---

### Task 2: Extend OpenAPI types for example fields

**Files:**
- Modify: `src/types/openapi.ts`

**Step 1: Add `example` field to SchemaObject and Parameter**

In `src/types/openapi.ts`, add `example` to `SchemaObject`:

```typescript
export interface SchemaObject {
  type?: string;
  format?: string;
  enum?: string[];
  default?: unknown;
  example?: unknown;          // <-- ADD
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  $ref?: string;
  oneOf?: SchemaObject[];
  allOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  discriminator?: { propertyName: string; mapping?: Record<string, string> };
}
```

No other type changes needed — `Parameter` already has `schema?: SchemaObject` which will carry the example through.

**Step 2: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds (no type errors)

**Step 3: Commit**

```bash
git add src/types/openapi.ts
git commit -m "feat(types): add example field to SchemaObject"
```

---

### Task 3: Preserve `example` in allOf merging and resolve response schema refs

**Files:**
- Modify: `src/hooks/developers/useOpenApiSpec.ts`

**Step 1: Update `resolveRefs` to preserve `example` during allOf merge**

In `resolveRefs()`, around line 31-39, the `allOf` merge block currently copies `type`, `description`, `properties`, `required`. Add `example`, `format`, `enum`, `discriminator`, `oneOf`:

Replace the allOf block:
```typescript
  // allOf: merge all sub-schemas into one (used for discriminated variant schemas)
  if (schema.allOf) {
    const merged: SchemaObject = {};
    for (const sub of schema.allOf) {
      const resolved = resolveRefs(sub, schemas, depth + 1);
      if (resolved.type) merged.type = resolved.type;
      if (resolved.description && !merged.description) merged.description = resolved.description;
      if (resolved.properties) merged.properties = { ...merged.properties, ...resolved.properties };
      if (resolved.required) merged.required = [...(merged.required ?? []), ...resolved.required];
    }
    return merged;
  }
```

With:
```typescript
  // allOf: merge all sub-schemas into one (used for discriminated variant schemas)
  if (schema.allOf) {
    const merged: SchemaObject = {};
    for (const sub of schema.allOf) {
      const resolved = resolveRefs(sub, schemas, depth + 1);
      if (resolved.type) merged.type = resolved.type;
      if (resolved.format && !merged.format) merged.format = resolved.format;
      if (resolved.description && !merged.description) merged.description = resolved.description;
      if (resolved.example !== undefined && merged.example === undefined) merged.example = resolved.example;
      if (resolved.enum && !merged.enum) merged.enum = resolved.enum;
      if (resolved.properties) merged.properties = { ...merged.properties, ...resolved.properties };
      if (resolved.required) merged.required = [...(merged.required ?? []), ...resolved.required];
      if (resolved.items && !merged.items) merged.items = resolved.items;
      if (resolved.oneOf && !merged.oneOf) merged.oneOf = resolved.oneOf;
      if (resolved.discriminator && !merged.discriminator) merged.discriminator = resolved.discriminator;
    }
    return merged;
  }
```

**Step 2: Resolve response schema `$ref`s in `parseSpec`**

In the `parseSpec` function, around line 105, the responses are currently passed as-is:
```typescript
        responses: operation.responses ?? {},
```

Replace with resolution:
```typescript
        responses: operation.responses
          ? Object.fromEntries(
              Object.entries(operation.responses).map(([code, resp]) => [
                code,
                {
                  ...resp,
                  content: resp.content
                    ? Object.fromEntries(
                        Object.entries(resp.content).map(([ct, media]) => [
                          ct,
                          {
                            ...media,
                            schema: media.schema
                              ? resolveRefs(media.schema, schemas)
                              : undefined,
                          },
                        ])
                      )
                    : undefined,
                },
              ])
            )
          : {},
```

**Step 3: Also resolve parameter schema `$ref`s**

Currently parameters are passed as-is. Their `schema` field may contain `$ref` (e.g., `$ref: '#/components/schemas/Address'` which has `example` and `format`). In `parseSpec`, replace:

```typescript
        parameters: operation.parameters ?? [],
```

With:
```typescript
        parameters: (operation.parameters ?? []).map((p) => ({
          ...p,
          schema: p.schema ? resolveRefs(p.schema, schemas) : undefined,
        })),
```

**Step 4: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/hooks/developers/useOpenApiSpec.ts
git commit -m "feat(openapi): preserve example in allOf, resolve response & parameter schema refs"
```

---

### Task 4: Pre-fill example values in `defaultForType`

**Files:**
- Modify: `src/app/developers/components/RequestBodyForm.tsx`

**Step 1: Update `defaultForType` to use `example` field**

Replace the current `defaultForType` function (lines 27-44):

```typescript
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
```

With:

```typescript
/** Returns a sensible default for a given schema type.
 *  Priority: example > default > type-inferred empty value */
export function defaultForType(schema?: SchemaObject): unknown {
  if (!schema) return "";
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.type === "string") return "";
  if (schema.type === "integer" || schema.type === "number") return 0;
  if (schema.type === "boolean") return false;
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
```

**Step 2: Verify the dev server renders example values**

Run: `pnpm dev`
Open `/developers/api`, expand a POST endpoint like "Submit transaction". The `sender` field should show `0x88fbd33f54e1126269769780feb24480428179f552e2313fbe571b72e62a1ca1` as pre-filled.

**Step 3: Commit**

```bash
git add src/app/developers/components/RequestBodyForm.tsx
git commit -m "feat(api): pre-fill form fields with OpenAPI example values"
```

---

### Task 5: Add example placeholders to ParameterForm

**Files:**
- Modify: `src/app/developers/components/ParameterForm.tsx`

**Step 1: Use `schema.example` as placeholder**

For parameters, we use `example` as placeholder text (not pre-filled value) to avoid accidental submissions. In `ParameterForm.tsx`, update both the mobile and desktop `Input` elements.

For the mobile Input (around line 72-79), change `placeholder` from:
```typescript
placeholder={param.description || param.name}
```
To:
```typescript
placeholder={
  param.schema?.example !== undefined
    ? String(param.schema.example)
    : param.description || param.name
}
```

For the desktop Input (around line 123-130), apply the same change:
```typescript
placeholder={
  param.schema?.example !== undefined
    ? String(param.schema.example)
    : param.description || param.name
}
```

Also add format display next to the type. In the mobile section (around line 63-70), after the type span, add format if present:

```typescript
<span
  className={cn(
    "text-[11px] ml-2",
    TYPE_COLORS[param.schema?.type ?? "string"] ??
      "text-muted-foreground/50",
  )}
>
  {param.schema?.type ?? "string"}
  {param.schema?.format && (
    <span className="text-muted-foreground/50 ml-1">
      ({param.schema.format})
    </span>
  )}
</span>
```

Apply the same format display in the desktop section (around line 113-120):

```typescript
<div
  className={cn(
    "text-[11px]",
    TYPE_COLORS[param.schema?.type ?? "string"] ??
      "text-muted-foreground/50",
  )}
>
  {param.schema?.type ?? "string"}
  {param.schema?.format && (
    <span className="text-muted-foreground/50 ml-1">
      ({param.schema.format})
    </span>
  )}
</div>
```

**Step 2: Verify in dev server**

Run: `pnpm dev`
The `address` parameter should show placeholder `0x88fbd33f54e1126269769780feb24480428179f552e2313fbe571b72e62a1ca1` and type label `string (hex)`.

**Step 3: Commit**

```bash
git add src/app/developers/components/ParameterForm.tsx
git commit -m "feat(api): show example placeholders and format hints in ParameterForm"
```

---

### Task 6: Header parameter support in ParameterForm

**Files:**
- Modify: `src/app/developers/components/ParameterForm.tsx`

**Step 1: Add header params group**

In `ParameterForm`, after the `queryParams` filter (line 34), add:

```typescript
const headerParams = parameters.filter((p) => p.in === "header");
```

After the query group push (line 40), add:

```typescript
if (headerParams.length > 0)
  groups.push({ label: "Header Parameters", params: headerParams });
```

No other changes needed — the rendering loop already handles groups generically.

**Step 2: Verify (if spec has header params)**

This may not be visible in the current Movement spec, but the code path is now active for any future header parameters.

**Step 3: Commit**

```bash
git add src/app/developers/components/ParameterForm.tsx
git commit -m "feat(api): support header parameters in ParameterForm"
```

---

### Task 7: Pass headers to RequestRunner and code snippets

**Files:**
- Modify: `src/app/developers/components/EndpointCard.tsx`
- Modify: `src/app/developers/components/RequestRunner.tsx`
- Modify: `src/utils/codeSnippets.ts`
- Modify: `src/app/developers/components/CodeSnippetTabs.tsx`

**Step 1: Collect header params in EndpointCard**

In `EndpointCard.tsx`, in the param splitting loop (lines 62-68), add header collection:

```typescript
const pathParams: Record<string, string> = {};
const queryParams: Record<string, string> = {};
const headerParams: Record<string, string> = {};
for (const param of endpoint.parameters) {
  const value = paramValues[param.name] ?? "";
  if (param.in === "path") pathParams[param.name] = value;
  if (param.in === "query" && value) queryParams[param.name] = value;
  if (param.in === "header" && value) headerParams[param.name] = value;
}
```

Pass `headers` to RequestRunner:
```tsx
<RequestRunner
  method={endpoint.method}
  url={fullUrl}
  body={bodySchema ? bodyValue : undefined}
  headers={headerParams}
  onBeforeRun={handleTryRequest}
/>
```

Pass `headers` to CodeSnippetTabs:
```tsx
<CodeSnippetTabs
  method={endpoint.method}
  baseUrl={network_value}
  path={endpoint.path}
  pathParams={pathParams}
  queryParams={queryParams}
  headers={headerParams}
  body={bodySchema ? bodyValue : undefined}
/>
```

**Step 2: Accept and use headers in RequestRunner**

In `RequestRunner.tsx`, update the interface:

```typescript
interface RequestRunnerProps {
  method: string;
  url: string;
  body?: object;
  headers?: Record<string, string>;
  onBeforeRun?: () => boolean;
}
```

Update the destructuring:
```typescript
export default function RequestRunner({ method, url, body, headers, onBeforeRun }: RequestRunnerProps) {
```

Update the fetch options (lines 37-41):
```typescript
const options: RequestInit = { method };
const reqHeaders: Record<string, string> = { ...headers };
if (body && method !== "GET") {
  reqHeaders["Content-Type"] = "application/json";
  options.body = JSON.stringify(body);
}
if (Object.keys(reqHeaders).length > 0) {
  options.headers = reqHeaders;
}
```

**Step 3: Add headers to code snippet generators**

In `src/utils/codeSnippets.ts`, add `headers` to the `SnippetParams` interface:

```typescript
interface SnippetParams {
  method: string;
  baseUrl: string;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: object;
}
```

Update `generateCurl` — after the Content-Type header line, add custom headers:

```typescript
export function generateCurl(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);
  const headerEntries = Object.entries(params.headers ?? {}).filter(([, v]) => v);

  if (params.method === "GET" && headerEntries.length === 0) {
    return `curl "${url}"`;
  }

  const parts = params.method === "GET"
    ? [`curl "${url}"`]
    : [`curl -X ${params.method} "${url}"`];
  for (const [k, v] of headerEntries) {
    parts.push(`  -H "${k}: ${v}"`);
  }
  if (params.body) {
    parts.push(`  -H "Content-Type: application/json"`);
    parts.push(`  -d '${JSON.stringify(params.body, null, 2)}'`);
  }
  return parts.join(" \\\n");
}
```

Update `generateJavaScript` — add headers object:

```typescript
export function generateJavaScript(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);
  const headerEntries = Object.entries(params.headers ?? {}).filter(([, v]) => v);
  const hasHeaders = headerEntries.length > 0 || (params.body && params.method !== "GET");

  if (params.method === "GET" && !hasHeaders) {
    return `const response = await fetch("${url}");
const data = await response.json();
console.log(data);`;
  }

  const headers: Record<string, string> = {};
  for (const [k, v] of headerEntries) headers[k] = v;
  if (params.body && params.method !== "GET") headers["Content-Type"] = "application/json";

  return `const response = await fetch("${url}", {
  method: "${params.method}",${Object.keys(headers).length > 0 ? `
  headers: ${JSON.stringify(headers, null, 2).split("\n").map((l, i) => i === 0 ? l : "  " + l).join("\n")},` : ""}${params.body ? `
  body: JSON.stringify(${JSON.stringify(params.body ?? {}, null, 2)}),` : ""}
});
const data = await response.json();
console.log(data);`;
}
```

Apply similar header support to `generatePython` and `generateGo`.

For Python:
```typescript
export function generatePython(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);
  const headerEntries = Object.entries(params.headers ?? {}).filter(([, v]) => v);
  const hasHeaders = headerEntries.length > 0;

  if (params.method === "GET" && !hasHeaders) {
    return `import requests

response = requests.get("${url}")
data = response.json()
print(data)`;
  }

  const headersStr = hasHeaders
    ? `\n    headers=${JSON.stringify(Object.fromEntries(headerEntries), null, 2).replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")},`
    : "";

  if (params.method === "GET") {
    return `import requests

response = requests.get(
    "${url}",${headersStr}
)
data = response.json()
print(data)`;
  }

  return `import requests

response = requests.${params.method.toLowerCase()}(
    "${url}",${headersStr}
    json=${JSON.stringify(params.body ?? {}, null, 2).replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")}
)
data = response.json()
print(data)`;
}
```

For Go, add header lines after setting Content-Type:
```typescript
// In generateGo, after req.Header.Set("Content-Type", ...):
const headerEntries = Object.entries(params.headers ?? {}).filter(([, v]) => v);
// Generate: req.Header.Set("Key", "Value") for each
```

**Step 4: Update CodeSnippetTabs to pass headers**

In `CodeSnippetTabs.tsx`, add `headers` to the interface:

```typescript
interface CodeSnippetTabsProps {
  method: string;
  baseUrl: string;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: object;
}
```

The `props` spread already passes all fields to `SNIPPET_GENERATORS[activeTab](props)`, so no other change needed.

**Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/developers/components/EndpointCard.tsx src/app/developers/components/RequestRunner.tsx src/utils/codeSnippets.ts src/app/developers/components/CodeSnippetTabs.tsx
git commit -m "feat(api): pass header params to RequestRunner and code snippets"
```

---

### Task 8: Pill Tabs for enum and discriminator fields

**Files:**
- Modify: `src/app/developers/components/RequestBodyForm.tsx`

**Step 1: Add Tabs imports**

At the top of `RequestBodyForm.tsx`, add:

```typescript
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

**Step 2: Create a `TabOrSelect` helper component**

Add this above the `StringEnumField` component:

```typescript
/** Renders pill tabs for <=4 options, falls back to Select for more */
function TabOrSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  if (options.length <= 4) {
    return (
      <Tabs value={value} onValueChange={onChange}>
        <TabsList variant="pill" className="gap-1.5">
          {options.map((opt) => (
            <TabsTrigger
              key={opt}
              value={opt}
              variant="pill"
              className="text-xs px-3 py-1.5 font-mono"
            >
              {opt}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-full font-mono text-sm">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="font-mono text-sm">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 3: Replace StringEnumField usage**

In `renderControl`, replace the `StringEnumField` call (lines 203-211):

```typescript
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
```

With:

```typescript
// string with enum -> pill tabs or dropdown
if (prop.type === "string" && prop.enum) {
  return (
    <TabOrSelect
      value={String(value[key] ?? "")}
      options={prop.enum}
      onChange={(v) => updateField(key, v)}
    />
  );
}
```

**Step 4: Replace discriminator variant selector**

In `renderControl`, replace the discriminator Select (lines 265-279):

```typescript
          <Select
            value={currentType}
            onValueChange={(v) => updateField(key, { [discriminatorProp]: v })}
          >
            <SelectTrigger size="sm" className="w-full font-mono text-sm">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {variantOptions.map((v) => (
                <SelectItem key={v} value={v} className="font-mono text-sm">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
```

With:

```typescript
          <TabOrSelect
            value={currentType}
            options={variantOptions}
            onChange={(v) => updateField(key, { [discriminatorProp]: v })}
          />
```

**Step 5: Clean up — remove unused `StringEnumField` component**

Delete the `StringEnumField` component (lines 58-81) since `TabOrSelect` now handles both cases.

**Step 6: Verify in dev server**

Run: `pnpm dev`
Open a POST endpoint with discriminator fields. Variants with ≤4 options should show pill tabs. The `AptosErrorCode` enum (18+ values) should still show as Select.

**Step 7: Commit**

```bash
git add src/app/developers/components/RequestBodyForm.tsx
git commit -m "feat(api): use pill tabs for enums and discriminators with <=4 options"
```

---

### Task 9: Create ResponseSchemaView component

**Files:**
- Create: `src/app/developers/components/ResponseSchemaView.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/developers/components/ResponseSchemaView.tsx
git commit -m "feat(api): create ResponseSchemaView component for response schema docs"
```

---

### Task 10: Integrate ResponseSchemaView into EndpointCard

**Files:**
- Modify: `src/app/developers/components/EndpointCard.tsx`

**Step 1: Import and render ResponseSchemaView**

Add import at the top of `EndpointCard.tsx`:

```typescript
import ResponseSchemaView from "./ResponseSchemaView";
```

After the RequestRunner section (after the closing `</div>` of the "Try It" section, around line 170), add:

```tsx
          {/* Response Schema */}
          {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
            <ResponseSchemaView responses={endpoint.responses} />
          )}
```

**Step 2: Verify in dev server**

Run: `pnpm dev`
Expand any endpoint — a collapsible "Response Schema" section should appear below "Try It". Click it to see status codes as pill tabs with the schema tree.

**Step 3: Commit**

```bash
git add src/app/developers/components/EndpointCard.tsx
git commit -m "feat(api): integrate ResponseSchemaView in EndpointCard"
```

---

### Task 11: Create useSchemaValidation hook

**Files:**
- Create: `src/hooks/developers/useSchemaValidation.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useMemo, useState, useCallback } from "react";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { SchemaObject } from "@/types/openapi";

/** Converts an Ajv instancePath (e.g. "/payload/function") to a dot-path (e.g. "payload.function") */
function instancePathToField(path: string): string {
  return path.replace(/^\//, "").replace(/\//g, ".");
}

/** Convert OpenAPI SchemaObject to a JSON Schema draft-07 compatible object */
function toJsonSchema(schema: SchemaObject): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (schema.type) result.type = schema.type;
  if (schema.format) result.format = schema.format;
  if (schema.enum) result.enum = schema.enum;
  if (schema.required) result.required = schema.required;
  if (schema.items) result.items = toJsonSchema(schema.items);
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, toJsonSchema(v)])
    );
  }
  if (schema.oneOf) {
    result.oneOf = schema.oneOf.map(toJsonSchema);
    if (schema.discriminator) {
      result.discriminator = { propertyName: schema.discriminator.propertyName };
    }
  }
  return result;
}

export interface ValidationErrors {
  /** Map from field path (e.g. "sender", "payload.function") to error message */
  fieldErrors: Map<string, string>;
  /** Whether there are any errors */
  hasErrors: boolean;
}

const EMPTY: ValidationErrors = { fieldErrors: new Map(), hasErrors: false };

export function useSchemaValidation(schema: SchemaObject | undefined) {
  const [errors, setErrors] = useState<ValidationErrors>(EMPTY);

  const ajv = useMemo(() => {
    const instance = new Ajv({ allErrors: true, strict: false });
    addFormats(instance);
    return instance;
  }, []);

  const validateFn = useMemo(() => {
    if (!schema) return null;
    try {
      return ajv.compile(toJsonSchema(schema));
    } catch {
      // If schema compilation fails (e.g., unsupported keywords), skip validation
      return null;
    }
  }, [ajv, schema]);

  const validate = useCallback(
    (data: unknown): boolean => {
      if (!validateFn) {
        setErrors(EMPTY);
        return true;
      }

      const valid = validateFn(data);
      if (valid) {
        setErrors(EMPTY);
        return true;
      }

      const fieldErrors = new Map<string, string>();
      for (const err of validateFn.errors ?? []) {
        const field = err.instancePath
          ? instancePathToField(err.instancePath)
          : err.params?.missingProperty ?? "";
        if (field) {
          fieldErrors.set(field, err.message ?? "Invalid value");
        }
      }
      setErrors({ fieldErrors, hasErrors: true });
      return false;
    },
    [validateFn],
  );

  const clearErrors = useCallback(() => setErrors(EMPTY), []);

  return { validate, errors, clearErrors };
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/hooks/developers/useSchemaValidation.ts
git commit -m "feat(api): create useSchemaValidation hook with Ajv"
```

---

### Task 12: Integrate validation in EndpointCard and RequestBodyForm

**Files:**
- Modify: `src/app/developers/components/EndpointCard.tsx`
- Modify: `src/app/developers/components/RequestBodyForm.tsx`

**Step 1: Add validation to EndpointCard**

Import the hook:
```typescript
import { useSchemaValidation } from "@/hooks/developers/useSchemaValidation";
```

After the `bodyValue` state declaration, add:
```typescript
const { validate: validateBody, errors: bodyErrors, clearErrors: clearBodyErrors } =
  useSchemaValidation(bodySchema);
```

Update `handleTryRequest` to also validate body:
```typescript
const handleTryRequest = () => {
  if (missingRequired.length > 0) {
    setValidationErrors(new Set(missingRequired.map((p) => p.name)));
    return false;
  }
  setValidationErrors(new Set());

  // Validate request body schema
  if (bodySchema && !validateBody(bodyValue)) {
    return false;
  }
  clearBodyErrors();
  return true;
};
```

Pass `bodyErrors` to RequestBodyForm:
```tsx
<RequestBodyForm
  schema={bodySchema}
  value={bodyValue}
  onChange={setBodyValue}
  errors={bodyErrors}
/>
```

**Step 2: Accept and display errors in RequestBodyForm**

Update the `RequestBodyFormProps` interface:
```typescript
import type { ValidationErrors } from "@/hooks/developers/useSchemaValidation";

interface RequestBodyFormProps {
  schema: SchemaObject;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  errors?: ValidationErrors;
  /** Prefix for nested field error paths */
  fieldPrefix?: string;
}
```

Update the component signature:
```typescript
export default function RequestBodyForm({
  schema,
  value,
  onChange,
  errors,
  fieldPrefix = "",
}: RequestBodyFormProps) {
```

Add a helper to get error for a field:
```typescript
const getFieldError = (key: string): string | undefined => {
  if (!errors?.hasErrors) return undefined;
  const path = fieldPrefix ? `${fieldPrefix}.${key}` : key;
  return errors.fieldErrors.get(path);
};
```

In both mobile and desktop layouts, after each `renderControl(key, prop)` call, add error display:
```tsx
{renderControl(key, prop)}
{getFieldError(key) && (
  <p className="text-xs text-destructive mt-1">{getFieldError(key)}</p>
)}
```

For recursive nested objects and discriminator sub-forms, pass `errors` and `fieldPrefix` through:
```tsx
<RequestBodyForm
  schema={variantSchema}
  value={fieldValue}
  onChange={(v) => updateField(key, { ...v, [discriminatorProp]: currentType })}
  errors={errors}
  fieldPrefix={fieldPrefix ? `${fieldPrefix}.${key}` : key}
/>
```

Same for nested object:
```tsx
<RequestBodyForm
  schema={prop}
  value={nested}
  onChange={(v) => updateField(key, v)}
  errors={errors}
  fieldPrefix={fieldPrefix ? `${fieldPrefix}.${key}` : key}
/>
```

**Step 3: Verify in dev server**

Run: `pnpm dev`
Open a POST endpoint, clear a required field, click "Send Request". Should see red error message below the specific field.

**Step 4: Commit**

```bash
git add src/app/developers/components/EndpointCard.tsx src/app/developers/components/RequestBodyForm.tsx
git commit -m "feat(api): integrate Ajv validation with field-level errors in forms"
```

---

### Task 13: Final build verification and cleanup

**Files:**
- All modified files

**Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 2: Run dev server and visually verify**

Run: `pnpm dev`

Verify each feature:
1. **Pill tabs**: Expand a POST endpoint with discriminator — variant selector uses pill tabs (≤4 options)
2. **Example values**: `sender` field pre-filled with `0x88fbd33...`, `address` param shows hex placeholder
3. **Response Schema**: Collapsible section below "Try It" shows status code tabs (200/400/404/etc.)
4. **Validation**: Clear a required field, click Send — see field-level error message
5. **Header params**: If any endpoint has header params, they show in a separate section

**Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "feat(api): complete API form enhancements - tabs, examples, validation, response schema"
```

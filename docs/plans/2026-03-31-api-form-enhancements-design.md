# API Form Enhancements Design

**Date**: 2026-03-31
**Scope**: Improve API developer portal form interactions to match docs.movementnetwork.xyz quality

## Goals

1. Enum/oneOf fields use Pill Tabs (≤4 options) instead of Select dropdowns
2. Pre-fill example values from OpenAPI spec (`example` > `default` > type inference)
3. Response Schema documentation with per-status-code tabs below RequestRunner
4. Ajv-based schema validation with field-level error messages
5. Header parameter support in ParameterForm and RequestRunner

## Non-Goals

- Page layout changes (sidebar + endpoint list stays as-is)
- New design system components (reuse existing primitives)
- Full Swagger UI / Redoc replacement

## Dependencies

- `ajv` — JSON Schema validation
- `ajv-formats` — format validators (hex, uri, etc.)
- Existing: `react-hook-form` (already in package.json), `@radix-ui/react-tabs`

---

## Change 1: Pill Tabs for Enum/oneOf

**Files**: `RequestBodyForm.tsx`

### Behavior

- `string` with `enum` (≤4 values): render as `PillTabsList` from existing `tabs.tsx`
- `string` with `enum` (>4 values): keep existing Select dropdown
- `oneOf` with `discriminator` (≤4 variants): render variant selector as Pill Tabs
- `oneOf` with `discriminator` (>4 variants): keep existing Select dropdown

### Implementation

Replace the Select in `StringEnumField` and the variant selector in the discriminator section with a conditional render:

```tsx
{options.length <= 4 ? (
  <Tabs value={value} onValueChange={onChange}>
    <PillTabsList>
      {options.map(opt => <TabsTrigger key={opt} value={opt}>{opt}</TabsTrigger>)}
    </PillTabsList>
  </Tabs>
) : (
  <Select value={value} onValueChange={onChange}>...</Select>
)}
```

No new components needed — `PillTabsList` and `TabsTrigger` already exist in `src/components/ui/tabs.tsx`.

---

## Change 2: Pre-filled Example Values

**Files**: `useOpenApiSpec.ts`, `RequestBodyForm.tsx`, `ParameterForm.tsx`, `EndpointCard.tsx`

### Schema Parsing

In `useOpenApiSpec.ts`, preserve `example` and `examples` fields during `resolveRefs()` — currently these fields survive resolution since only `$ref` triggers replacement, but verify they're not stripped during `allOf` merging.

### Default Value Priority

Modify `defaultForType()` in `RequestBodyForm.tsx`:

```
Priority: schema.example > schema.default > type-inferred empty value
```

For objects, recursively apply the same priority per-property.

### Parameter Placeholders

In `ParameterForm.tsx`, use `schema.example` as the input's `placeholder` attribute (not pre-filled value, to avoid accidental submissions with example data for path/query params).

### Body Pre-fill

For request body, pre-fill the form state with example values via the updated `defaultForType()`. This is safe because body values are explicitly constructed by the user expanding and editing.

---

## Change 3: Response Schema Documentation

**Files**: New `ResponseSchemaView.tsx`, `EndpointCard.tsx`, `useOpenApiSpec.ts`

### Component: ResponseSchemaView

A collapsible section below RequestRunner that displays response schemas grouped by status code.

```
▼ Response Schema
  [200] [400] [404] [500]
  ───────────────────────
  Successful response

  hash         string (hex)     Transaction hash
  sender       string (address) Account address
  sequence_num string (uint64)  Sequence number
  ...
```

### Schema Tree Rendering

Recursive read-only property list:
- Property name (left) + type badge with `TYPE_COLORS` + format in parens + description
- Nested objects indent with left border (same visual pattern as RequestBodyForm)
- Arrays show `items` schema inline
- `oneOf` shows each variant as a collapsible sub-section

### Spec Parsing

In `useOpenApiSpec.ts`, apply `resolveRefs()` to each response object's schema (currently only request body schemas are resolved). The `ParsedEndpoint.responses` field already exists but contains unresolved schemas.

---

## Change 4: Ajv Schema Validation

**Files**: New `useSchemaValidation.ts`, `EndpointCard.tsx`, `RequestBodyForm.tsx`, `ParameterForm.tsx`

### Hook: useSchemaValidation

```tsx
function useSchemaValidation(schema: SchemaObject | undefined) {
  // Compile schema with Ajv (memoized)
  // Return: { validate, errors, clearErrors }
  // errors: Map<fieldPath, errorMessage>
}
```

- Uses `ajv` with `ajv-formats` for format validation
- Compiles schema once, validates on demand
- Maps Ajv error `instancePath` (e.g., `/payload/function`) to field paths for inline display

### Integration Points

1. **EndpointCard**: call `validate(bodyValue)` in `handleTryRequest()` before `onBeforeRun`
2. **RequestBodyForm**: receive `errors` map as prop, display red border + message per field
3. **ParameterForm**: validate individual params against their `schema` (type + format + required)

### Error Display

- Red border on invalid field (consistent with existing required-field error style)
- Error message text below input in `text-destructive text-xs`
- Errors clear on value change or successful validation

---

## Change 5: Header Parameter Support

**Files**: `ParameterForm.tsx`, `EndpointCard.tsx`, `RequestRunner.tsx`, `codeSnippets.ts`

### ParameterForm

Add third section "Header Parameters" alongside existing Path and Query sections. Same input style — text Input with label, description, required indicator.

### EndpointCard

Collect header param values in the existing `paramValues` state (they're already keyed by name). Pass header params separately to RequestRunner.

### RequestRunner

Accept new `headers` prop (`Record<string, string>`). Merge into fetch options:

```tsx
options.headers = {
  ...(body ? { "Content-Type": "application/json" } : {}),
  ...headers,
};
```

### Code Snippets

Update all generators in `codeSnippets.ts` to accept and render header params (e.g., `-H "X-Custom: value"` for curl).

---

## File Change Summary

| File | Action | Changes |
|------|--------|---------|
| `RequestBodyForm.tsx` | Modify | Pill tabs for enum/oneOf, example pre-fill, validation errors |
| `ParameterForm.tsx` | Modify | Header params section, example placeholders, validation errors |
| `EndpointCard.tsx` | Modify | Validation integration, header collection, response schema area |
| `RequestRunner.tsx` | Modify | Custom headers support |
| `useOpenApiSpec.ts` | Modify | Resolve response schema refs, preserve examples |
| `codeSnippets.ts` | Modify | Header param support in all generators |
| `ResponseSchemaView.tsx` | Create | Response schema tree documentation component |
| `useSchemaValidation.ts` | Create | Ajv-based schema validation hook |
| `package.json` | Modify | Add ajv, ajv-formats |

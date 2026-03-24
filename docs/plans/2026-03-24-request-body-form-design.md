# Request Body Form Design

## Problem

POST endpoints currently use a raw `<textarea>` for editing JSON request bodies, while GET endpoints have a structured `ParameterForm` with labeled inputs, type indicators, and validation. This creates an inconsistent UX.

## Solution

Create a new `RequestBodyForm` component that recursively generates structured form fields from OpenAPI `SchemaObject`, matching the visual style of `ParameterForm`.

## Component Design

### `RequestBodyForm`

**File**: `src/app/developers/components/RequestBodyForm.tsx`

**Props**:
```typescript
interface RequestBodyFormProps {
  schema: SchemaObject;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}
```

### Field Type Mapping

| Schema type | Rendered as |
|---|---|
| `string` | `<Input>` text field |
| `integer` / `number` | `<Input type="number">` |
| `boolean` | Checkbox-style toggle |
| `string` + `enum` | `<select>` dropdown |
| `array` (items: primitive) | Dynamic row list with +/- buttons |
| `object` (nested) | Recursive sub-form with indentation |

### Array Field Interaction

Each array item gets its own input row with a remove button. A "+ Add item" button at the bottom appends a new empty row.

```
type_arguments
  [ "0x1::aptos_coin::AptosCoin" ]  [×]
  [  placeholder...                ]  [×]
                                    [+ Add item]
```

### Visual Consistency

Reuse design tokens from `ParameterForm`:
- `TYPE_COLORS` for type labels
- `font-mono` for field names
- Red `*` for required fields
- Grid layout (desktop) / stacked layout (mobile)
- `<Input>` component from `@/components/ui/input`

## Integration in EndpointCard

1. Replace `<textarea>` with `<RequestBodyForm>`
2. Change state from `bodyText: string` to `bodyValue: Record<string, unknown>` (structured data)
3. Pass object directly to `RequestRunner` — no JSON.parse needed
4. Initialize from `schemaToTemplate(bodySchema)` (existing function)

## Scope

- Handles the Movement API's current POST body patterns (flat objects, string arrays)
- Does NOT handle `$ref` dereferencing or `oneOf`/`anyOf` (not used in current API)

"use client";

import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import type {
  OpenApiSpec,
  ParsedEndpoint,
  EndpointGroup,
  PathItem,
  Operation,
  SchemaObject,
} from "@/types/openapi";

/** Recursively resolve $ref references from components/schemas (max depth 10) */
function resolveRefs(
  schema: SchemaObject,
  schemas: Record<string, SchemaObject>,
  depth = 0
): SchemaObject {
  if (depth > 10) return schema;

  if (schema.$ref) {
    const name = schema.$ref.split("/").pop()!;
    const resolved = schemas[name];
    if (!resolved) return schema;
    return resolveRefs(resolved, schemas, depth + 1);
  }

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

  const result: SchemaObject = { ...schema };

  // oneOf: resolve each variant's $ref so RequestBodyForm can inspect their properties
  if (result.oneOf) {
    result.oneOf = result.oneOf.map((sub) => resolveRefs(sub, schemas, depth + 1));
  }

  if (result.properties) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([k, v]) => [
        k,
        resolveRefs(v, schemas, depth + 1),
      ])
    );
  }

  if (result.items) {
    result.items = resolveRefs(result.items, schemas, depth + 1);
  }

  return result;
}

function parseSpec(spec: OpenApiSpec): EndpointGroup[] {
  const schemas = spec.components?.schemas ?? {};
  const endpointsByTag = new Map<string, ParsedEndpoint[]>();

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const methods = ["get", "post", "put", "delete"] as const;

    for (const method of methods) {
      const operation = (pathItem as PathItem)[method] as Operation | undefined;
      if (!operation) continue;

      const tag = operation.tags?.[0] ?? "Other";
      const endpoint: ParsedEndpoint = {
        id: `${method}-${path}`.replace(/[{}\/]/g, "-"),
        method: method.toUpperCase() as ParsedEndpoint["method"],
        path,
        summary: operation.summary ?? "",
        description: operation.description ?? "",
        tag,
        parameters: operation.parameters ?? [],
        requestBody: operation.requestBody
          ? {
              ...operation.requestBody,
              content: operation.requestBody.content
                ? Object.fromEntries(
                    Object.entries(operation.requestBody.content).map(
                      ([contentType, mediaType]) => [
                        contentType,
                        {
                          ...mediaType,
                          schema: mediaType.schema
                            ? resolveRefs(mediaType.schema, schemas)
                            : undefined,
                        },
                      ]
                    )
                  )
                : undefined,
            }
          : undefined,
        responses: operation.responses ?? {},
      };

      if (!endpointsByTag.has(tag)) {
        endpointsByTag.set(tag, []);
      }
      endpointsByTag.get(tag)!.push(endpoint);
    }
  }

  const tagDescriptions = new Map(
    spec.tags?.map((t) => [t.name, t.description]) ?? []
  );

  return Array.from(endpointsByTag.entries()).map(([tag, endpoints]) => ({
    tag,
    description: tagDescriptions.get(tag),
    endpoints,
  }));
}

export function useOpenApiSpec() {
  const { network_value } = useGlobalStore();
  const specUrl = network_value ? `${network_value}/spec.yaml` : null;

  return useQuery({
    queryKey: ["openapi-spec", specUrl],
    queryFn: async () => {
      if (!specUrl) throw new Error("No network selected");

      const res = await fetch(specUrl);
      if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status}`);

      const text = await res.text();
      let spec: OpenApiSpec;
      try {
        spec = JSON.parse(text);
      } catch {
        const { load } = await import("js-yaml");
        spec = load(text) as OpenApiSpec;
      }

      return parseSpec(spec);
    },
    enabled: !!specUrl,
    staleTime: 1000 * 60 * 60,
  });
}

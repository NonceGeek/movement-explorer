"use client";

import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import type {
  OpenApiSpec,
  ParsedEndpoint,
  EndpointGroup,
  PathItem,
  Operation,
} from "@/types/openapi";

function parseSpec(spec: OpenApiSpec): EndpointGroup[] {
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
        requestBody: operation.requestBody,
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

"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";
import { useGlobalStore } from "@/store/useGlobalStore";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ParsedEndpoint, SchemaObject } from "@/types/openapi";
import ParameterForm from "./ParameterForm";
import RequestRunner from "./RequestRunner";
import CodeSnippetTabs from "./CodeSnippetTabs";
import RequestBodyForm from "./RequestBodyForm";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 border-blue-200",
  POST: "bg-green-100 text-green-700 border-green-200",
  PUT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

/** Generate a placeholder JSON body from a schema */
function schemaToTemplate(schema?: SchemaObject): unknown {
  if (!schema) return {};
  if (schema.type === "string") return schema.default ?? "";
  if (schema.type === "integer" || schema.type === "number") return schema.default ?? 0;
  if (schema.type === "boolean") return schema.default ?? false;
  if (schema.type === "array") return [schemaToTemplate(schema.items)];
  if (schema.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      obj[key] = schemaToTemplate(prop);
    }
    return obj;
  }
  return {};
}

interface EndpointCardProps {
  endpoint: ParsedEndpoint;
}

export default function EndpointCard({ endpoint }: EndpointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const { network_value } = useGlobalStore();

  // Request body state for POST/PUT
  const bodySchema = endpoint.requestBody?.content?.["application/json"]?.schema;
  const [bodyValue, setBodyValue] = useState<Record<string, unknown>>(() =>
    bodySchema ? (schemaToTemplate(bodySchema) as Record<string, unknown>) : {}
  );

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
    if (value && validationErrors.has(name)) {
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const missingRequired = endpoint.parameters
    .filter((p) => p.required && !(paramValues[p.name] ?? "").trim());

  const handleTryRequest = () => {
    if (missingRequired.length > 0) {
      setValidationErrors(new Set(missingRequired.map((p) => p.name)));
      return false;
    }
    setValidationErrors(new Set());
    return true;
  };

  // Split params by type for URL building
  const pathParams: Record<string, string> = {};
  const queryParams: Record<string, string> = {};
  for (const param of endpoint.parameters) {
    const value = paramValues[param.name] ?? "";
    if (param.in === "path") pathParams[param.name] = value;
    if (param.in === "query" && value) queryParams[param.name] = value;
  }

  // Build the full request URL for RequestRunner
  let requestPath = endpoint.path;
  for (const [key, value] of Object.entries(pathParams)) {
    if (value) requestPath = requestPath.replace(`{${key}}`, value);
  }
  const queryString = Object.entries(queryParams)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const fullUrl = `${network_value}${requestPath}${queryString ? `?${queryString}` : ""}`;

  return (
    <div
      id={`endpoint-${endpoint.id}`}
      className="rounded-lg border overflow-hidden scroll-mt-32"
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left cursor-pointer"
      >
        <span
          className={cn(
            "px-2 py-0.5 rounded text-xs font-mono font-bold border",
            METHOD_COLORS[endpoint.method] ?? "bg-gray-100 text-gray-700"
          )}
        >
          {endpoint.method}
        </span>
        <span className="font-mono text-sm flex-1 truncate">
          {endpoint.path}
        </span>
        <span className="text-sm text-muted-foreground hidden sm:block max-w-[300px] truncate">
          {endpoint.summary}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-6">
          {/* Description */}
          {endpoint.description && (
            <p className="text-sm text-muted-foreground">
              {endpoint.description}
            </p>
          )}

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Parameters</h4>
              <ParameterForm
                parameters={endpoint.parameters}
                values={paramValues}
                onChange={handleParamChange}
                errorParams={validationErrors}
              />
            </div>
          )}

          {/* Request Body */}
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

          {/* Try it */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Try It</h4>
            <div className="rounded-md bg-muted/30 border border-border/30 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
              <span className="font-semibold text-foreground">{endpoint.method}</span>{" "}
              {fullUrl}
            </div>
            <RequestRunner
              method={endpoint.method}
              url={fullUrl}
              body={bodySchema ? bodyValue : undefined}
              onBeforeRun={handleTryRequest}
            />
          </div>

          {/* Code Snippets */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Code Examples</h4>
            <CodeSnippetTabs
              method={endpoint.method}
              baseUrl={network_value}
              path={endpoint.path}
              pathParams={pathParams}
              queryParams={queryParams}
            />
          </div>
        </div>
      )}
    </div>
  );
}

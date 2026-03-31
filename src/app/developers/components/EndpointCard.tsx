"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/utils/styling";
import { useGlobalStore } from "@/store/useGlobalStore";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ParsedEndpoint } from "@/types/openapi";
import ParameterForm from "./ParameterForm";
import RequestRunner from "./RequestRunner";
import CodeSnippetTabs from "./CodeSnippetTabs";
import RequestBodyForm, { defaultForType } from "./RequestBodyForm";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 border-blue-200",
  POST: "bg-green-100 text-green-700 border-green-200",
  PUT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};


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
    bodySchema ? (defaultForType(bodySchema) as Record<string, unknown>) : {}
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
  const headerParams: Record<string, string> = {};
  for (const param of endpoint.parameters) {
    const value = paramValues[param.name] ?? "";
    if (param.in === "path") pathParams[param.name] = value;
    if (param.in === "query" && value) queryParams[param.name] = value;
    if (param.in === "header" && value) headerParams[param.name] = value;
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
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-sm text-muted-foreground mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5 my-2 text-sm text-muted-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5 my-2 text-sm text-muted-foreground">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{children}</code>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>,
              }}
            >
              {endpoint.description}
            </ReactMarkdown>
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
              headers={headerParams}
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
              headers={headerParams}
              body={bodySchema ? bodyValue : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

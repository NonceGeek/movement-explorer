"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/utils/styling";
import { useGlobalStore } from "@/store/useGlobalStore";
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink } from "lucide-react";
import type { ParsedEndpoint } from "@/types/openapi";
import ParameterForm from "./ParameterForm";
import RequestRunner from "./RequestRunner";
import CodeSnippetTabs from "./CodeSnippetTabs";
import RequestBodyForm, { defaultForType } from "./RequestBodyForm";
import ResponseSchemaView from "./ResponseSchemaView";
import { useSchemaValidation } from "@/hooks/developers/useSchemaValidation";
import { endpointToMarkdown } from "../utils/endpointToMarkdown";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const GITHUB_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);
const CHATGPT_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.67.014a6.054 6.054 0 00-5.79 4.218 5.938 5.938 0 00-3.966 2.89A6.023 6.023 0 002.65 13.4a5.98 5.98 0 00.516 4.911 6.051 6.051 0 006.51 2.9 6.064 6.064 0 003.586 1.39 6.048 6.048 0 005.79-4.218 5.94 5.94 0 003.966-2.89 6.024 6.024 0 00-.736-6.672zM16.54 21.202a4.555 4.555 0 01-2.917-1.06l.145-.083 4.842-2.796a.79.79 0 00.394-.683v-6.82l2.047 1.182a.073.073 0 01.04.056v5.654a4.575 4.575 0 01-4.55 4.55zM3.145 17.34a4.531 4.531 0 01-.543-3.046l.145.087 4.842 2.796a.776.776 0 00.786 0l5.91-3.414v2.365a.07.07 0 01-.03.06l-4.895 2.828a4.573 4.573 0 01-6.215-1.676zM1.994 7.846a4.544 4.544 0 012.374-1.996v5.759a.775.775 0 00.392.681l5.91 3.413-2.047 1.182a.073.073 0 01-.069.006L3.66 14.063a4.574 4.574 0 01-1.666-6.217zm17.543 4.087l-5.91-3.414 2.047-1.182a.073.073 0 01.069-.006l4.893 2.826a4.558 4.558 0 01-.764 8.217v-5.759a.785.785 0 00-.335-.682zm2.036-3.067l-.145-.087-4.842-2.796a.776.776 0 00-.786 0l-5.91 3.414V7.032a.07.07 0 01.03-.06l4.895-2.827a4.56 4.56 0 016.758 4.721zM8.678 14.038l-2.047-1.182a.073.073 0 01-.04-.056V7.146a4.558 4.558 0 017.467-3.51l-.145.083-4.842 2.796a.79.79 0 00-.393.683zm1.112-2.398l2.632-1.52 2.632 1.52v3.04l-2.632 1.52-2.632-1.52z" />
  </svg>
);
const CLAUDE_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.709 15.955l4.71-2.758-4.71-2.757L.051 8.017l2.395-1.381 4.66 2.723 4.659-2.723L16.423.95l2.396 1.382-4.66 2.723 4.66 2.723 4.658 2.724-2.396 1.381-4.659-2.723-4.658 2.723-4.66-2.724-4.658 2.724-2.396-1.38 4.659-2.724zm0 0" />
  </svg>
);
const T3_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

/** Copy Markdown + Open-in dropdown for an endpoint */
function EndpointActions({
  endpoint,
  baseUrl,
}: {
  endpoint: ParsedEndpoint;
  baseUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const getMarkdown = useCallback(
    () => endpointToMarkdown(endpoint, baseUrl),
    [endpoint, baseUrl],
  );

  const githubUrl = `https://github.com/movementlabsxyz/movement-docs/blob/main/content/docs/api/node/${endpoint.operationId}.mdx`;

  const openTargets = [
    { name: "GitHub", icon: GITHUB_ICON, href: githubUrl },
    {
      name: "ChatGPT",
      icon: CHATGPT_ICON,
      href: `https://chatgpt.com/?q=${encodeURIComponent(getMarkdown())}`,
    },
    {
      name: "Claude",
      icon: CLAUDE_ICON,
      href: `https://claude.ai/new?q=${encodeURIComponent(getMarkdown())}`,
    },
    {
      name: "T3 Chat",
      icon: T3_ICON,
      href: `https://t3.chat/new?q=${encodeURIComponent(getMarkdown())}`,
    },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy Markdown"}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer">
            Open
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="min-w-[180px]">
          {openTargets.map((target) => (
            <DropdownMenuItem key={target.name} asChild>
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {target.icon}
                  {target.name}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 border-blue-200",
  POST: "bg-green-100 text-green-700 border-green-200",
  PUT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};


interface EndpointCardProps {
  endpoint: ParsedEndpoint;
  autoExpand?: boolean;
}

export default function EndpointCard({ endpoint, autoExpand }: EndpointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when triggered from sidebar click
  useEffect(() => {
    if (autoExpand) setIsExpanded(true);
  }, [autoExpand]);

  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const { network_value } = useGlobalStore();

  // Request body state for POST/PUT
  const bodySchema = endpoint.requestBody?.content?.["application/json"]?.schema;
  const [bodyValue, setBodyValue] = useState<Record<string, unknown>>(() =>
    bodySchema ? (defaultForType(bodySchema) as Record<string, unknown>) : {}
  );

  const { validate: validateBody, errors: bodyErrors, clearErrors: clearBodyErrors } =
    useSchemaValidation(bodySchema);

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

    // Validate request body schema
    if (bodySchema && !validateBody(bodyValue)) {
      return false;
    }
    clearBodyErrors();
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
          {/* Actions: Copy Markdown + Open in... */}
          <EndpointActions endpoint={endpoint} baseUrl={network_value} />

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
            <div className="border-t border-border/40 pt-4">
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
            <div className="border-t border-border/40 pt-4">
              <h4 className="text-sm font-semibold mb-3">Request Body</h4>
              <RequestBodyForm
                schema={bodySchema}
                value={bodyValue}
                onChange={setBodyValue}
                errors={bodyErrors}
              />
            </div>
          )}

          {/* Try it */}
          <div className="border-t border-border/40 pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Try It</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-md bg-muted/30 border border-border/30 px-3 py-2 font-mono text-xs text-muted-foreground truncate">
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
          </div>

          {/* Response Schema */}
          {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
            <ResponseSchemaView responses={endpoint.responses} />
          )}

          {/* Code Snippets */}
          <div className="border-t border-border/40 pt-4">
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

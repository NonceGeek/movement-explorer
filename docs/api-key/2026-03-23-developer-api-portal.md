# Developer API Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a developer API portal into Movement Explorer with interactive API docs, code snippets, LLM guides, API key management, MCP Server, and built-in AI chat.

**Architecture:** Embedded in Explorer as `/developers/*` routes. V1 is pure frontend (OpenAPI spec parsing + interactive docs). V2 adds Next.js API Routes + Neon DB for key management. V3 adds MCP Server npm package + AI chat widget with pluggable LLM provider.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, Radix UI, Zustand, TanStack Query, Shiki, OpenAPI 3.0 spec parsing

**Design Doc:** `docs/plans/2026-03-23-developer-api-portal-design.md`

---

## Phase 1: V1 — Interactive API Documentation (Frontend Only)

### Task 1: Add "Developers" to Navigation

**Files:**
- Modify: `src/components/layout/types.ts`

**Step 1: Add Developers dropdown to NAV_ITEMS**

In `src/components/layout/types.ts`, add a new dropdown entry after Analytics:

```typescript
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Blockchain",
    items: [
      { href: "/transactions", label: "Transactions" },
      { href: "/blocks", label: "Blocks" },
    ],
  },
  { href: "/validators", label: "Validators" },
  { href: "/analytics", label: "Analytics" },
  {
    label: "Developers",
    items: [
      { href: "/developers", label: "Overview" },
      { href: "/developers/api", label: "API Docs" },
      { href: "/developers/guides", label: "Guides" },
    ],
  },
] as const;
```

**Step 2: Verify navigation renders**

Run: `pnpm dev`
Check: Header should show "Developers" dropdown with 3 items.

**Step 3: Commit**

```bash
git add src/components/layout/types.ts
git commit -m "feat(developers): add Developers dropdown to navigation"
```

---

### Task 2: OpenAPI Spec Fetching & Parsing

**Files:**
- Create: `src/hooks/developers/useOpenApiSpec.ts`
- Create: `src/types/openapi.ts`

**Step 1: Create OpenAPI types**

Create `src/types/openapi.ts`:

```typescript
export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, PathItem>;
  tags?: ApiTag[];
}

export interface ApiTag {
  name: string;
  description?: string;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
}

export interface Operation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, ResponseObject>;
}

export interface Parameter {
  name: string;
  in: "path" | "query" | "header";
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

export interface RequestBody {
  required?: boolean;
  content?: Record<string, { schema?: SchemaObject }>;
  description?: string;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: SchemaObject }>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  enum?: string[];
  default?: unknown;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  $ref?: string;
}

/** Parsed endpoint ready for display */
export interface ParsedEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  description: string;
  tag: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseObject>;
}

/** Endpoints grouped by tag */
export interface EndpointGroup {
  tag: string;
  description?: string;
  endpoints: ParsedEndpoint[];
}
```

**Step 2: Create the hook**

Create `src/hooks/developers/useOpenApiSpec.ts`:

```typescript
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

  // Find tag descriptions from spec
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

  // network_value is like "https://mainnet.movementnetwork.xyz/v1"
  // OpenAPI spec is at the same base + "/spec.yaml"
  const specUrl = network_value ? `${network_value}/spec.yaml` : null;

  return useQuery({
    queryKey: ["openapi-spec", specUrl],
    queryFn: async () => {
      if (!specUrl) throw new Error("No network selected");

      const res = await fetch(specUrl);
      if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status}`);

      const text = await res.text();
      // spec.yaml is actually JSON despite the extension on some nodes
      // try JSON first, fall back to yaml parsing
      let spec: OpenApiSpec;
      try {
        spec = JSON.parse(text);
      } catch {
        // Need a yaml parser — install js-yaml or use a lightweight one
        const { load } = await import("js-yaml");
        spec = load(text) as OpenApiSpec;
      }

      return parseSpec(spec);
    },
    enabled: !!specUrl,
    staleTime: 1000 * 60 * 60, // cache for 1 hour
  });
}
```

**Step 3: Install js-yaml for YAML parsing**

Run: `pnpm add js-yaml && pnpm add -D @types/js-yaml`

**Step 4: Verify the hook compiles**

Run: `pnpm build`
Expected: Build succeeds (hook is not yet used, but should compile)

**Step 5: Commit**

```bash
git add src/types/openapi.ts src/hooks/developers/useOpenApiSpec.ts package.json pnpm-lock.yaml
git commit -m "feat(developers): add OpenAPI spec fetching and parsing hook"
```

---

### Task 3: Developers Sidebar Component

**Files:**
- Create: `src/app/developers/components/DevelopersSidebar.tsx`

**Step 1: Create the sidebar**

Follow the AnalyticsSidebar pattern exactly. Create `src/app/developers/components/DevelopersSidebar.tsx`:

```typescript
"use client";

import { cn } from "@/utils/styling";
import {
  BookOpen,
  Code,
  Key,
  Bot,
  FileText,
  X,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export type DevelopersSectionId =
  | "overview"
  | "api-docs"
  | "guides"
  | "api-keys"
  | "ai-assistant";

interface SidebarItem {
  id: DevelopersSectionId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    href: "/developers",
  },
  {
    id: "api-docs",
    title: "API Docs",
    icon: Code,
    href: "/developers/api",
  },
  {
    id: "guides",
    title: "Guides",
    icon: FileText,
    href: "/developers/guides",
  },
  {
    id: "api-keys",
    title: "API Keys",
    icon: Key,
    href: "/developers/api-keys",
    badge: "Soon",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Bot,
    href: "/developers/ai",
    badge: "Soon",
  },
];

interface DevelopersSidebarProps {
  activeSection: DevelopersSectionId;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

function SidebarNav({
  activeSection,
  onItemClick,
}: {
  activeSection: DevelopersSectionId;
  onItemClick?: (item: SidebarItem) => void;
}) {
  return (
    <div className="p-4 space-y-1">
      {SIDEBAR_ITEMS.map((item) => (
        <a
          key={item.id}
          href={item.badge ? undefined : item.href}
          onClick={(e) => {
            if (item.badge) {
              e.preventDefault();
              return;
            }
            onItemClick?.(item);
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeSection === item.id
              ? "bg-guild-green/10 text-guild-green"
              : item.badge
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {item.badge}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export default function DevelopersSidebar({
  activeSection,
  isMobileOpen,
  onMobileToggle,
}: DevelopersSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block w-[250px] flex-shrink-0 self-start sticky top-32 z-10",
          "bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg",
          "max-h-[calc(100vh-6rem)] overflow-hidden"
        )}
      >
        <SidebarNav activeSection={activeSection} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Developers</span>
            <button onClick={onMobileToggle}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarNav
            activeSection={activeSection}
            onItemClick={() => onMobileToggle()}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm build`

**Step 3: Commit**

```bash
git add src/app/developers/components/DevelopersSidebar.tsx
git commit -m "feat(developers): add sidebar navigation component"
```

---

### Task 4: Developers Overview Page

**Files:**
- Create: `src/app/developers/page.tsx`
- Create: `src/app/developers/layout.tsx`

**Step 1: Create the layout**

Create `src/app/developers/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers | Movement Explorer",
  description:
    "Explore the Movement blockchain API, generate API keys, and integrate with your applications.",
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Step 2: Create the overview page**

Create `src/app/developers/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  FileText,
  Key,
  Bot,
  ArrowRight,
  Terminal,
  Menu,
} from "lucide-react";
import Link from "next/link";
import DevelopersSidebar from "./components/DevelopersSidebar";

const FEATURE_CARDS = [
  {
    title: "API Documentation",
    description:
      "Interactive documentation for all 27+ Movement Node API endpoints. Test requests directly in your browser.",
    icon: Code,
    href: "/developers/api",
    cta: "Browse Endpoints",
  },
  {
    title: "Code Examples",
    description:
      "Ready-to-use code snippets in cURL, JavaScript, Python, and Go for every endpoint.",
    icon: Terminal,
    href: "/developers/api",
    cta: "View Examples",
  },
  {
    title: "Guides",
    description:
      "Learn how to integrate Movement APIs with ChatGPT, Claude, portfolio managers, and DeFi tools.",
    icon: FileText,
    href: "/developers/guides",
    cta: "Read Guides",
  },
  {
    title: "API Keys",
    description:
      "Generate and manage API keys for rate-limited access to Movement APIs.",
    icon: Key,
    href: "/developers/api-keys",
    cta: "Coming Soon",
    disabled: true,
  },
  {
    title: "AI Assistant",
    description:
      "Ask questions about on-chain data in natural language. Powered by AI with direct blockchain access.",
    icon: Bot,
    href: "/developers/ai",
    cta: "Coming Soon",
    disabled: true,
  },
];

export default function DevelopersPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="flex gap-6">
          <DevelopersSidebar
            activeSection="overview"
            isMobileOpen={isMobileSidebarOpen}
            onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <div className="flex-1 min-w-0">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </div>

            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Developer Portal</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Build on Movement. Access blockchain data, submit transactions,
                and integrate with your applications using the Movement Node
                API.
              </p>
            </div>

            {/* Quick Start */}
            <Card className="mb-8 border-guild-green/30 bg-guild-green/5">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started with a simple API call:
                </p>
                <div className="bg-background rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <span className="text-muted-foreground">$</span>{" "}
                  <span className="text-guild-green">curl</span>{" "}
                  https://mainnet.movementnetwork.xyz/v1/info
                </div>
              </CardContent>
            </Card>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURE_CARDS.map((card) => (
                <Card
                  key={card.title}
                  className={
                    card.disabled ? "opacity-60" : "hover:border-guild-green/30 transition-colors"
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-guild-green/10">
                        <card.icon className="h-5 w-5 text-guild-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{card.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {card.description}
                        </p>
                        {card.disabled ? (
                          <span className="text-xs text-muted-foreground">
                            {card.cta}
                          </span>
                        ) : (
                          <Link
                            href={card.href}
                            className="text-sm text-guild-green hover:underline inline-flex items-center gap-1"
                          >
                            {card.cta}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
```

**Step 3: Verify page renders**

Run: `pnpm dev`
Navigate to: `http://localhost:3000/developers`
Expected: Overview page with sidebar, hero, quick start card, and feature grid.

**Step 4: Commit**

```bash
git add src/app/developers/
git commit -m "feat(developers): add overview page with feature cards and sidebar"
```

---

### Task 5: Code Snippet Generator Utility

**Files:**
- Create: `src/utils/codeSnippets.ts`

**Step 1: Create the code snippet generator**

Create `src/utils/codeSnippets.ts`:

```typescript
interface SnippetParams {
  method: string;
  baseUrl: string;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: object;
}

function buildUrl(
  baseUrl: string,
  path: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string>
): string {
  let url = `${baseUrl}${path}`;

  // Replace path params
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, value || `{${key}}`);
    }
  }

  // Add query params
  if (queryParams) {
    const entries = Object.entries(queryParams).filter(([, v]) => v);
    if (entries.length > 0) {
      url += "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    }
  }

  return url;
}

export function generateCurl(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);

  if (params.method === "GET") {
    return `curl ${url}`;
  }

  const parts = [`curl -X ${params.method} ${url}`];
  if (params.body) {
    parts.push(`  -H "Content-Type: application/json"`);
    parts.push(`  -d '${JSON.stringify(params.body, null, 2)}'`);
  }
  return parts.join(" \\\n");
}

export function generateJavaScript(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);

  if (params.method === "GET") {
    return `const response = await fetch("${url}");
const data = await response.json();
console.log(data);`;
  }

  return `const response = await fetch("${url}", {
  method: "${params.method}",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(params.body ?? {}, null, 2)}),
});
const data = await response.json();
console.log(data);`;
}

export function generatePython(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);

  if (params.method === "GET") {
    return `import requests

response = requests.get("${url}")
data = response.json()
print(data)`;
  }

  return `import requests

response = requests.${params.method.toLowerCase()}(
    "${url}",
    json=${JSON.stringify(params.body ?? {}, null, 2).replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")}
)
data = response.json()
print(data)`;
}

export function generateGo(params: SnippetParams): string {
  const url = buildUrl(params.baseUrl, params.path, params.pathParams, params.queryParams);

  if (params.method === "GET") {
    return `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    resp, err := http.Get("${url}")
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
  }

  return `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    payload := []byte(\`${JSON.stringify(params.body ?? {}, null, 2)}\`)
    resp, err := http.NewRequest("${params.method}", "${url}", bytes.NewBuffer(payload))
    if err != nil {
        panic(err)
    }
    resp.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    response, _ := client.Do(resp)
    defer response.Body.Close()

    body, _ := io.ReadAll(response.Body)
    fmt.Println(string(body))
}`;
}

export type SnippetLanguage = "curl" | "javascript" | "python" | "go";

export const SNIPPET_GENERATORS: Record<
  SnippetLanguage,
  (params: SnippetParams) => string
> = {
  curl: generateCurl,
  javascript: generateJavaScript,
  python: generatePython,
  go: generateGo,
};

export const SNIPPET_LABELS: Record<SnippetLanguage, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  python: "Python",
  go: "Go",
};
```

**Step 2: Verify it compiles**

Run: `pnpm build`

**Step 3: Commit**

```bash
git add src/utils/codeSnippets.ts
git commit -m "feat(developers): add multi-language code snippet generator"
```

---

### Task 6: Request Runner Component

**Files:**
- Create: `src/app/developers/components/RequestRunner.tsx`

**Step 1: Create the request runner**

Create `src/app/developers/components/RequestRunner.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";
import { Play, Loader2, Copy, Check } from "lucide-react";

interface RequestRunnerProps {
  method: string;
  url: string;
  body?: object;
}

export default function RequestRunner({ method, url, body }: RequestRunnerProps) {
  const [response, setResponse] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);

    const start = performance.now();

    try {
      const options: RequestInit = { method };
      if (body && method !== "GET") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setStatusCode(res.status);

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleRun}
        disabled={loading}
        size="sm"
        className="bg-guild-green hover:bg-guild-green/90 text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        Send Request
      </Button>

      {(response || error) && (
        <div className="rounded-lg border overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b text-sm">
            <div className="flex items-center gap-3">
              {statusCode && (
                <span
                  className={cn(
                    "font-mono font-medium",
                    statusCode < 300
                      ? "text-green-600"
                      : statusCode < 400
                        ? "text-yellow-600"
                        : "text-red-600"
                  )}
                >
                  {statusCode}
                </span>
              )}
              {responseTime !== null && (
                <span className="text-muted-foreground">
                  {responseTime}ms
                </span>
              )}
            </div>
            {response && (
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Response body */}
          <pre className="p-4 text-sm font-mono overflow-x-auto max-h-[400px] overflow-y-auto bg-background">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              response
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/developers/components/RequestRunner.tsx
git commit -m "feat(developers): add RequestRunner component for live API testing"
```

---

### Task 7: Parameter Form Component

**Files:**
- Create: `src/app/developers/components/ParameterForm.tsx`

**Step 1: Create the parameter form**

Create `src/app/developers/components/ParameterForm.tsx`:

```typescript
"use client";

import { Input } from "@/components/ui/input";
import type { Parameter } from "@/types/openapi";

interface ParameterFormProps {
  parameters: Parameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export default function ParameterForm({
  parameters,
  values,
  onChange,
}: ParameterFormProps) {
  if (parameters.length === 0) return null;

  // Group by location (path, query, header)
  const pathParams = parameters.filter((p) => p.in === "path");
  const queryParams = parameters.filter((p) => p.in === "query");

  return (
    <div className="space-y-4">
      {pathParams.length > 0 && (
        <ParamGroup label="Path Parameters" params={pathParams} values={values} onChange={onChange} />
      )}
      {queryParams.length > 0 && (
        <ParamGroup label="Query Parameters" params={queryParams} values={values} onChange={onChange} />
      )}
    </div>
  );
}

function ParamGroup({
  label,
  params,
  values,
  onChange,
}: {
  label: string;
  params: Parameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {label}
      </h4>
      <div className="space-y-2">
        {params.map((param) => (
          <div key={param.name} className="flex items-start gap-3">
            <div className="w-32 flex-shrink-0 pt-2">
              <span className="text-sm font-mono">{param.name}</span>
              {param.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
              <div className="text-xs text-muted-foreground">
                {param.schema?.type ?? "string"}
              </div>
            </div>
            <div className="flex-1">
              <Input
                placeholder={param.description || param.name}
                value={values[param.name] ?? ""}
                onChange={(e) => onChange(param.name, e.target.value)}
                className="font-mono text-sm"
              />
              {param.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {param.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/developers/components/ParameterForm.tsx
git commit -m "feat(developers): add ParameterForm for API endpoint parameters"
```

---

### Task 8: Code Snippet Tabs Component

**Files:**
- Create: `src/app/developers/components/CodeSnippetTabs.tsx`

**Step 1: Create the component**

Create `src/app/developers/components/CodeSnippetTabs.tsx`:

```typescript
"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";
import { Copy, Check } from "lucide-react";
import {
  SNIPPET_GENERATORS,
  SNIPPET_LABELS,
  type SnippetLanguage,
} from "@/utils/codeSnippets";

interface CodeSnippetTabsProps {
  method: string;
  baseUrl: string;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: object;
}

const LANGUAGES: SnippetLanguage[] = ["curl", "javascript", "python", "go"];

export default function CodeSnippetTabs(props: CodeSnippetTabsProps) {
  const [activeTab, setActiveTab] = useState<SnippetLanguage>("curl");
  const [copied, setCopied] = useState(false);

  const snippet = SNIPPET_GENERATORS[activeTab](props);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between bg-muted/50 border-b px-1">
        <div className="flex">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveTab(lang)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors",
                activeTab === lang
                  ? "text-foreground border-b-2 border-guild-green"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {SNIPPET_LABELS[lang]}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="p-4 text-sm font-mono overflow-x-auto bg-background">
        {snippet}
      </pre>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/developers/components/CodeSnippetTabs.tsx
git commit -m "feat(developers): add CodeSnippetTabs with multi-language support"
```

---

### Task 9: Endpoint Card Component

**Files:**
- Create: `src/app/developers/components/EndpointCard.tsx`

**Step 1: Create the endpoint card**

Create `src/app/developers/components/EndpointCard.tsx`:

```typescript
"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";
import { useGlobalStore } from "@/store/useGlobalStore";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ParsedEndpoint } from "@/types/openapi";
import ParameterForm from "./ParameterForm";
import RequestRunner from "./RequestRunner";
import CodeSnippetTabs from "./CodeSnippetTabs";

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
  const { network_value } = useGlobalStore();

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
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
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
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
              />
            </div>
          )}

          {/* Try it */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Try It</h4>
            <div className="mb-2 font-mono text-xs text-muted-foreground break-all">
              {endpoint.method} {fullUrl}
            </div>
            <RequestRunner method={endpoint.method} url={fullUrl} />
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
```

**Step 2: Commit**

```bash
git add src/app/developers/components/EndpointCard.tsx
git commit -m "feat(developers): add EndpointCard with params, runner, and snippets"
```

---

### Task 10: API Docs Page (Main Interactive Documentation)

**Files:**
- Create: `src/app/developers/api/page.tsx`

**Step 1: Create the API docs page**

Create `src/app/developers/api/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Menu, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/utils/styling";
import { useOpenApiSpec } from "@/hooks/developers/useOpenApiSpec";
import type { EndpointGroup } from "@/types/openapi";
import DevelopersSidebar from "../components/DevelopersSidebar";
import EndpointCard from "../components/EndpointCard";

/** Sidebar for API endpoint categories */
function ApiSidebar({
  groups,
  activeTag,
  onTagClick,
}: {
  groups: EndpointGroup[];
  activeTag: string;
  onTagClick: (tag: string) => void;
}) {
  return (
    <aside
      className={cn(
        "hidden lg:block w-[220px] flex-shrink-0 self-start sticky top-32 z-10",
        "bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg",
        "max-h-[calc(100vh-6rem)] overflow-hidden"
      )}
    >
      <div className="overflow-y-auto max-h-[calc(100vh-10rem)] p-3 space-y-0.5">
        {groups.map((group) => (
          <button
            key={group.tag}
            onClick={() => onTagClick(group.tag)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left",
              activeTag === group.tag
                ? "bg-guild-green/10 text-guild-green font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span>{group.tag}</span>
            <span className="text-xs text-muted-foreground">
              {group.endpoints.length}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function ApiDocsPage() {
  const { data: groups, isLoading, error } = useOpenApiSpec();
  const [activeTag, setActiveTag] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);

  // Set initial active tag when data loads
  useEffect(() => {
    if (groups && groups.length > 0 && !activeTag) {
      setActiveTag(groups[0].tag);
    }
  }, [groups, activeTag]);

  // Scroll spy for active tag
  useEffect(() => {
    if (!groups || isScrolling) return;

    const handleScroll = () => {
      for (let i = groups.length - 1; i >= 0; i--) {
        const el = document.getElementById(`tag-${groups[i].tag}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveTag(groups[i].tag);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [groups, isScrolling]);

  const handleTagClick = (tag: string) => {
    setIsScrolling(true);
    setActiveTag(tag);

    const el = document.getElementById(`tag-${tag}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => setIsScrolling(false), 800);
  };

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Interactive documentation for the Movement Node API. Test endpoints
            directly in your browser.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading API specification...
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Failed to load API specification. Please try again.</span>
          </div>
        )}

        {groups && (
          <div className="flex gap-6">
            {/* Tag sidebar */}
            <ApiSidebar
              groups={groups}
              activeTag={activeTag}
              onTagClick={handleTagClick}
            />

            {/* Endpoint list */}
            <div className="flex-1 min-w-0 space-y-8">
              {groups.map((group) => (
                <section
                  key={group.tag}
                  id={`tag-${group.tag}`}
                  className="scroll-mt-32"
                >
                  <h2 className="text-xl font-semibold mb-1">{group.tag}</h2>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {group.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    {group.endpoints.map((endpoint) => (
                      <EndpointCard key={endpoint.id} endpoint={endpoint} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
```

**Step 2: Verify the full flow**

Run: `pnpm dev`
Navigate to: `http://localhost:3000/developers/api`
Expected:
- API spec loads from mainnet node
- Sidebar shows endpoint categories (Accounts, Blocks, etc.)
- Each endpoint is expandable with params, try-it, and code snippets
- Scroll-spy highlights active category

**Step 3: Commit**

```bash
git add src/app/developers/api/
git commit -m "feat(developers): add interactive API docs page with live testing"
```

---

### Task 11: Guides Page

**Files:**
- Create: `src/app/developers/guides/page.tsx`
- Create: `src/app/developers/guides/data.ts`

**Step 1: Create guides data**

Create `src/app/developers/guides/data.ts`:

```typescript
export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: "ai" | "portfolio" | "getting-started";
  content: string; // Markdown content
}

export const GUIDES: Guide[] = [
  {
    slug: "chatgpt-integration",
    title: "Using Movement API with ChatGPT",
    description:
      "Import the Movement OpenAPI spec into a Custom GPT to query blockchain data with natural language.",
    category: "ai",
    content: `
## Using Movement API with ChatGPT

You can create a Custom GPT that queries Movement blockchain data using natural language.

### Step 1: Download the OpenAPI Spec

Download the Movement API specification:

\`\`\`
https://mainnet.movementnetwork.xyz/v1/spec.yaml
\`\`\`

### Step 2: Create a Custom GPT

1. Go to [ChatGPT](https://chat.openai.com) → Explore GPTs → Create
2. In the **Configure** tab, add a name like "Movement Blockchain Assistant"
3. Under **Actions**, click "Create new action"
4. Click "Import from URL" and paste the spec URL above
5. Save your GPT

### Step 3: Start Querying

Now you can ask questions like:
- "What's the balance of address 0x1?"
- "Show me the latest transactions"
- "What's the current ledger version?"

The GPT will automatically call the correct Movement API endpoints.
    `,
  },
  {
    slug: "claude-mcp",
    title: "Using Movement API with Claude (MCP)",
    description:
      "Set up the Movement MCP Server so Claude can directly query on-chain data.",
    category: "ai",
    content: `
## Using Movement API with Claude via MCP

The Movement MCP Server lets Claude Desktop query blockchain data directly.

> **Note:** The MCP Server package (\`@movement/chain-mcp-server\`) is coming soon. This guide will be updated with installation instructions when it's available.

### What You'll Be Able to Do

Once the MCP Server is available, you can ask Claude:
- "What tokens does 0x1 hold?"
- "Show me transaction details for hash 0x..."
- "What's the current network TPS?"

### Current Alternative

In the meantime, you can use the Movement API directly. Here's how to provide context to Claude:

1. Copy the API base URL: \`https://mainnet.movementnetwork.xyz/v1\`
2. Tell Claude about the available endpoints
3. Ask Claude to generate fetch/curl commands for your queries

### API Endpoints for Common Queries

| Query | Endpoint |
|-------|----------|
| Account info | \`GET /accounts/{address}\` |
| Token balance | \`GET /accounts/{address}/resources\` |
| Transaction | \`GET /transactions/by_hash/{hash}\` |
| Latest block | \`GET /blocks/by_height/{height}\` |
| Network info | \`GET /info\` |
    `,
  },
  {
    slug: "portfolio-integration",
    title: "Portfolio Manager Integration",
    description:
      "Query token balances, holdings, and transaction history for portfolio tracking tools.",
    category: "portfolio",
    content: `
## Portfolio Manager Integration

Use the Movement API to build portfolio tracking for Movement addresses.

### Querying Token Balances

To get all tokens held by an address:

\`\`\`bash
curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/resources
\`\`\`

Filter the response for \`0x1::coin::CoinStore\` resources to find token balances.

### Querying Transaction History

Get recent transactions for an address:

\`\`\`bash
curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/transactions
\`\`\`

### Getting Token Prices

For USD-denominated portfolio values, combine on-chain balance data with price feeds from CoinGecko or similar services.

### Example: Portfolio Summary

\`\`\`javascript
async function getPortfolio(address) {
  const res = await fetch(
    \`https://mainnet.movementnetwork.xyz/v1/accounts/\${address}/resources\`
  );
  const resources = await res.json();

  const coinStores = resources.filter((r) =>
    r.type.includes("0x1::coin::CoinStore")
  );

  return coinStores.map((store) => ({
    token: store.type.split("<")[1].split(">")[0],
    balance: store.data.coin.value,
  }));
}
\`\`\`

> **Coming Soon:** Dedicated Portfolio API endpoints with pre-aggregated data and USD pricing.
    `,
  },
  {
    slug: "defi-data",
    title: "DeFi Data Queries",
    description:
      "Query LP positions, staking info, and DeFi protocol data from Movement.",
    category: "portfolio",
    content: `
## DeFi Data Queries

Query DeFi protocol data on the Movement blockchain.

### Staking Information

Query validator staking data:

\`\`\`bash
curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/resource/0x1::stake::StakePool
\`\`\`

### View Functions

Use the view function endpoint to call read-only Move functions:

\`\`\`bash
curl -X POST https://mainnet.movementnetwork.xyz/v1/view \\
  -H "Content-Type: application/json" \\
  -d '{
    "function": "0x1::coin::balance",
    "type_arguments": ["0x1::aptos_coin::AptosCoin"],
    "arguments": ["0x1"]
  }'
\`\`\`

### LP Position Queries

LP positions are protocol-specific. Query the relevant protocol's module resources:

\`\`\`javascript
async function getLPPositions(address, protocolAddress) {
  const res = await fetch(
    \`https://mainnet.movementnetwork.xyz/v1/accounts/\${address}/resources\`
  );
  const resources = await res.json();

  return resources.filter((r) =>
    r.type.startsWith(protocolAddress)
  );
}
\`\`\`

> **Coming Soon:** Aggregated DeFi position endpoints with protocol-specific decoders.
    `,
  },
];
```

**Step 2: Create the guides page**

Create `src/app/developers/guides/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Briefcase, Menu } from "lucide-react";
import DevelopersSidebar from "../components/DevelopersSidebar";
import { GUIDES, type Guide } from "./data";

const CATEGORY_META = {
  ai: { label: "AI Integration", icon: Bot },
  portfolio: { label: "Portfolio & DeFi", icon: Briefcase },
  "getting-started": { label: "Getting Started", icon: Bot },
};

function GuideContent({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        All Guides
      </Button>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div
          dangerouslySetInnerHTML={{
            __html: simpleMarkdownToHtml(guide.content),
          }}
        />
      </div>
    </div>
  );
}

/** Minimal markdown → HTML for guide content */
function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-guild-green/30 pl-4 my-4 text-sm text-muted-foreground">$1</blockquote>')
    .replace(/\|(.+)\|/g, (match) => {
      // Simple table handling
      return match;
    })
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-guild-green hover:underline">$1</a>')
    .replace(/\n\n/g, "<br/><br/>");
}

export default function GuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Group guides by category
  const grouped = GUIDES.reduce(
    (acc, guide) => {
      if (!acc[guide.category]) acc[guide.category] = [];
      acc[guide.category].push(guide);
      return acc;
    },
    {} as Record<string, Guide[]>
  );

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="flex gap-6">
          <DevelopersSidebar
            activeSection="guides"
            isMobileOpen={isMobileSidebarOpen}
            onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <div className="flex-1 min-w-0">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </div>

            {selectedGuide ? (
              <GuideContent
                guide={selectedGuide}
                onBack={() => setSelectedGuide(null)}
              />
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold">Guides</h1>
                  <p className="text-muted-foreground mt-2">
                    Learn how to integrate Movement APIs with AI tools,
                    portfolio managers, and your applications.
                  </p>
                </div>

                {Object.entries(grouped).map(([category, guides]) => {
                  const meta =
                    CATEGORY_META[category as keyof typeof CATEGORY_META];
                  return (
                    <div key={category} className="mb-8">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {meta && <meta.icon className="h-5 w-5 text-guild-green" />}
                        {meta?.label ?? category}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guides.map((guide) => (
                          <Card
                            key={guide.slug}
                            className="cursor-pointer hover:border-guild-green/30 transition-colors"
                            onClick={() => setSelectedGuide(guide)}
                          >
                            <CardContent className="p-5">
                              <h3 className="font-semibold mb-1">
                                {guide.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {guide.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
```

**Step 3: Verify guides render**

Run: `pnpm dev`
Navigate to: `http://localhost:3000/developers/guides`
Expected: Guide cards grouped by category. Clicking opens guide content.

**Step 4: Commit**

```bash
git add src/app/developers/guides/
git commit -m "feat(developers): add guides page with AI and portfolio integration docs"
```

---

### Task 12: Final V1 Polish — Build Verification

**Step 1: Full build check**

Run: `pnpm build`
Expected: Build succeeds with no errors.

**Step 2: Manual verification checklist**

Run `pnpm dev` and verify:
- [ ] Header shows "Developers" dropdown with 3 items
- [ ] `/developers` — Overview page renders with cards and sidebar
- [ ] `/developers/api` — API docs load with endpoints grouped by tag
- [ ] Endpoint cards expand showing params, try-it, and code snippets
- [ ] "Send Request" works and shows response
- [ ] Code snippet tabs switch between cURL/JS/Python/Go
- [ ] Network switching changes API base URL
- [ ] `/developers/guides` — Guides page shows cards, clicking opens content
- [ ] Mobile responsive: sidebar becomes drawer
- [ ] Scroll-spy highlights active tag in API docs sidebar

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "feat(developers): complete V1 interactive API documentation"
```

---

## Phase 2: V2 — API Key Management (Outline)

> These tasks are outlined at a higher level. Expand into bite-sized steps when V2 development begins.

### Task 13: Database Setup

- Create Neon PostgreSQL project for Movement Explorer
- Create tables: `users`, `api_keys`, `api_usage` (see design doc for schema)
- Add database connection string to environment variables
- Install: `pnpm add @neondatabase/serverless` (or Drizzle ORM)

### Task 14: Wallet Authentication API Routes

- Create `src/app/api/auth/nonce/route.ts` — generate random nonce
- Create `src/app/api/auth/verify/route.ts` — verify wallet signature, create/find user, return JWT
- Install: `pnpm add jose` (for JWT generation/verification)
- Create auth middleware: `src/lib/auth.ts`

### Task 15: API Key CRUD Routes

- Create `src/app/api/keys/route.ts` — GET (list) + POST (create)
- Create `src/app/api/keys/[id]/route.ts` — DELETE (revoke)
- Create `src/app/api/keys/[id]/stats/route.ts` — GET (usage stats)
- Key generation: `mvmt_` prefix + crypto.randomBytes
- Store key hash (not plaintext) using SHA-256

### Task 16: API Gateway Provider Interface

- Create `src/services/api-gateway/interface.ts` — ApiGatewayProvider interface
- Create `src/services/api-gateway/internal.ts` — built-in implementation using Neon DB
- Create `src/services/api-gateway/index.ts` — factory to select provider based on env

### Task 17: API Keys Page UI

- Create `src/app/developers/api-keys/page.tsx`
- Auth gate: check JWT, show "Connect Wallet" if not authenticated
- Key list: display cards with prefix, label, rate limit, usage
- Create key dialog: label input, rate limit select
- Usage chart: 30-day line chart + endpoint breakdown
- Remove "Soon" badge from sidebar for api-keys

### Task 18: Auth Context & Wallet Sign-In

- Create `src/hooks/developers/useAuth.ts` — manage JWT + wallet signing flow
- Add sign-in button to DevelopersSidebar when on api-keys route
- Store JWT in localStorage, auto-refresh on expiry

---

## Phase 3: V3 — MCP Server + AI Chat (Outline)

### Task 19: MCP Server Package

- Create new package: `packages/movement-mcp-server/`
- Implement 10 MCP tools (see design doc)
- Add `package.json` with `bin` entry for `npx` usage
- Create `README.md` with installation instructions
- Publish to npm as `@movement/chain-mcp-server`

### Task 20: LLM Provider Interface

- Create `src/services/llm/interface.ts` — LLMProvider interface
- Create `src/services/llm/claude.ts` — Anthropic Claude implementation
- Create `src/services/llm/openai.ts` — OpenAI implementation
- Create `src/services/llm/index.ts` — factory based on env vars

### Task 21: Chat API Route

- Create `src/app/api/chat/route.ts` — SSE streaming endpoint
- System prompt with Movement blockchain context + tool definitions
- Tool execution: call Movement API based on LLM tool_use responses
- Rate limiting: 20 free queries/day, more with API key

### Task 22: AI Chat Widget

- Create `src/components/ai/ChatWidget.tsx` — floating chat button + expandable window
- Create `src/components/ai/ChatMessage.tsx` — message bubble component
- Create `src/components/ai/ToolCallIndicator.tsx` — shows "Querying..." during tool calls
- Add to root layout (global, appears on all pages)
- Context-aware: detect current page address/transaction
- Remove "Soon" badge from sidebar for ai-assistant

### Task 23: Portfolio Data API Routes

- Create `src/app/api/portfolio/[address]/route.ts` — full overview
- Create `src/app/api/portfolio/[address]/tokens/route.ts` — token holdings + USD
- Create `src/app/api/portfolio/[address]/defi/route.ts` — LP + staking
- Create `src/app/api/portfolio/[address]/history/route.ts` — paginated tx history
- Aggregate: Node API + Indexer + CoinGecko price data

### Task 24: Update Guides for V3

- Update "Claude MCP" guide with actual installation instructions
- Add guide: "Using the AI Assistant"
- Update portfolio guide with new dedicated API endpoints

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

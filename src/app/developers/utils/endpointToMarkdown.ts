import type { ParsedEndpoint, SchemaObject } from "@/types/openapi";

/** Render a schema as a compact markdown property list */
function schemaToMd(schema: SchemaObject, indent = 0): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];

  // oneOf / anyOf
  const variants = schema.oneOf ?? schema.anyOf;
  if (variants) {
    const label = schema.oneOf ? "One of" : "Any of";
    lines.push(`${pad}- *${label}:*`);
    for (const v of variants) {
      if (v.properties || v.items?.properties) {
        const name = v.title ?? v.type ?? "object";
        lines.push(`${pad}  - **${name}**`);
        lines.push(schemaToMd(v, indent + 2));
      } else {
        const t = v.type ?? "unknown";
        const fmt = v.format ? ` (${v.format})` : "";
        lines.push(`${pad}  - \`${t}${fmt}\``);
      }
    }
    return lines.join("\n");
  }

  // array
  if (schema.type === "array" && schema.items) {
    const items = schema.items;
    if (items.properties) {
      lines.push(`${pad}- *array of objects:*`);
      lines.push(schemaToMd(items, indent + 1));
    } else {
      const t = items.type ?? "unknown";
      lines.push(`${pad}- array[${t}]`);
    }
    return lines.join("\n");
  }

  // object with properties
  if (schema.properties) {
    const required = new Set(schema.required ?? []);
    for (const [key, prop] of Object.entries(schema.properties)) {
      const type = prop.type ?? "object";
      const fmt = prop.format ? ` (${prop.format})` : "";
      const req = required.has(key) ? " **required**" : "";
      const desc = prop.description ? ` — ${prop.description}` : "";

      if (prop.properties || prop.items?.properties || prop.oneOf || prop.anyOf) {
        lines.push(`${pad}- \`${key}\`: ${type}${fmt}${req}${desc}`);
        lines.push(schemaToMd(prop, indent + 1));
      } else if (prop.enum) {
        lines.push(
          `${pad}- \`${key}\`: ${type}${req} — enum: ${prop.enum.map((e) => `\`${e}\``).join(", ")}${desc}`,
        );
      } else {
        lines.push(`${pad}- \`${key}\`: ${type}${fmt}${req}${desc}`);
      }
    }
    return lines.join("\n");
  }

  return "";
}

/** Convert a ParsedEndpoint into a readable Markdown string */
export function endpointToMarkdown(
  endpoint: ParsedEndpoint,
  baseUrl?: string,
): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${endpoint.method} ${endpoint.path}`);
  lines.push("");

  if (endpoint.summary) {
    lines.push(`> ${endpoint.summary}`);
    lines.push("");
  }

  if (endpoint.description) {
    lines.push(endpoint.description);
    lines.push("");
  }

  if (baseUrl) {
    lines.push(`**Base URL:** \`${baseUrl}\``);
    lines.push("");
  }

  // Parameters
  if (endpoint.parameters.length > 0) {
    lines.push("## Parameters");
    lines.push("");
    lines.push("| Name | In | Type | Required | Description |");
    lines.push("|------|----|------|----------|-------------|");
    for (const p of endpoint.parameters) {
      const type = p.schema?.type ?? "string";
      const fmt = p.schema?.format ? ` (${p.schema.format})` : "";
      const req = p.required ? "Yes" : "No";
      const desc =
        p.description?.replace(/\|/g, "\\|").replace(/\n/g, " ") ?? "";
      lines.push(`| \`${p.name}\` | ${p.in} | ${type}${fmt} | ${req} | ${desc} |`);
    }
    lines.push("");
  }

  // Request Body
  const bodySchema =
    endpoint.requestBody?.content?.["application/json"]?.schema;
  if (bodySchema) {
    lines.push("## Request Body");
    lines.push("");
    if (endpoint.requestBody?.description) {
      lines.push(endpoint.requestBody.description);
      lines.push("");
    }
    const md = schemaToMd(bodySchema);
    if (md) {
      lines.push(md);
      lines.push("");
    }
  }

  // Responses
  const responseCodes = Object.keys(endpoint.responses ?? {}).sort();
  if (responseCodes.length > 0) {
    lines.push("## Responses");
    lines.push("");
    for (const code of responseCodes) {
      const resp = endpoint.responses[code];
      lines.push(`### ${code}`);
      if (resp.description) {
        lines.push(resp.description);
      }
      const schema = resp.content?.["application/json"]?.schema;
      if (schema) {
        lines.push("");
        const md = schemaToMd(schema);
        if (md) lines.push(md);
      }
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

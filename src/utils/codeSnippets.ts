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

  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, value || `{${key}}`);
    }
  }

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
    return `curl "${url}"`;
  }

  const parts = [`curl -X ${params.method} "${url}"`];
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
    req, err := http.NewRequest("${params.method}", "${url}", bytes.NewBuffer(payload))
    if err != nil {
        panic(err)
    }
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    response, _ := client.Do(req)
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

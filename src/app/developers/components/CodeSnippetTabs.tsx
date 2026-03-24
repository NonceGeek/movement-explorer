"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";
import { Copy, Check } from "lucide-react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import {
  SNIPPET_GENERATORS,
  SNIPPET_LABELS,
  type SnippetLanguage,
} from "@/utils/codeSnippets";

const SHIKI_LANG: Record<SnippetLanguage, string> = {
  curl: "bash",
  javascript: "javascript",
  python: "python",
  go: "go",
};

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
                "px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
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
          className="p-2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Code */}
      <CodeBlock
        code={snippet}
        language={SHIKI_LANG[activeTab]}
        maxHeight="300px"
      />
    </div>
  );
}

"use client";

import { useEffect, useState, forwardRef } from "react";
import {
  createHighlighter,
  createCssVariablesTheme,
  type Highlighter,
} from "shiki";

const movementTheme = createCssVariablesTheme({
  name: "movement",
  variablePrefix: "--shiki-",
  variableDefaults: {},
});

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [movementTheme],
      langs: ["rust", "toml", "bash", "javascript", "python", "go", "json"],
    });
  }
  return highlighterPromise;
}

function addLineAnchors(html: string, prefix: string): string {
  let lineNum = 0;
  return html.replace(
    /<span class="line"/g,
    () => {
      lineNum++;
      return `<span class="line" id="${prefix}-line-${lineNum}" data-line="${lineNum}"`;
    },
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: string;
  lineAnchorPrefix?: string;
}

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  function CodeBlock(
    { code, language = "rust", maxHeight = "500px", lineAnchorPrefix },
    ref,
  ) {
    const [html, setHtml] = useState<string>("");

    useEffect(() => {
      let cancelled = false;
      getHighlighter().then((highlighter) => {
        if (cancelled) return;
        const result = highlighter.codeToHtml(code, {
          lang: language,
          theme: "movement",
        });
        setHtml(result);
      });
      return () => {
        cancelled = true;
      };
    }, [code, language]);

    if (!html) {
      return (
        <pre
          className="bg-muted/30 p-4 rounded-lg overflow-auto text-[13px] leading-[1.7] font-mono"
          style={{ maxHeight }}
        >
          {code}
        </pre>
      );
    }

    const processedHtml = lineAnchorPrefix
      ? addLineAnchors(html, lineAnchorPrefix)
      : html;

    return (
      <div
        ref={ref}
        className="shiki-wrapper overflow-auto rounded-lg [&_pre]:p-4 [&_pre]:m-0 [&_pre]:text-[13px] [&_pre]:leading-[1.7] [&_code]:font-mono"
        style={{ maxHeight }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    );
  },
);

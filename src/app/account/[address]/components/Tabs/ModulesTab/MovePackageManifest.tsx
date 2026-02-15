"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Copy, Check, Maximize2, Minimize2, FileText } from "lucide-react";
import { transformCode } from "@/utils";
import { CodeBlock } from "@/components/ui/CodeBlock";

interface MovePackageManifestProps {
  manifest: string;
}

export default function MovePackageManifest({
  manifest,
}: MovePackageManifestProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const manifestText = useMemo(() => transformCode(manifest), [manifest]);

  if (!manifestText) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(manifestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Package Manifest
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-1 text-xs">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? "Code copied!" : "Copy code"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 px-2"
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">
                {expanded ? "Collapse" : "Expand"}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CodeBlock
          code={manifestText}
          language="toml"
          maxHeight={expanded ? "none" : "300px"}
        />
      </CardContent>
    </Card>
  );
}

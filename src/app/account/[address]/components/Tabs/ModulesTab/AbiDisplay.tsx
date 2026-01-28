"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AbiDisplayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any;
  title?: string;
  defaultExpanded?: boolean;
}

export default function AbiDisplay({
  abi,
  title = "ABI",
  defaultExpanded = false,
}: AbiDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const abiString = JSON.stringify(abi, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(abiString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
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
              <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">
                {isExpanded ? "Collapse" : "Expand"}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "bg-muted rounded-lg transition-all duration-200 overflow-auto",
            isExpanded ? "max-h-[500px]" : "max-h-32",
          )}
        >
          <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
            {abiString}
          </pre>
        </div>
        {!isExpanded && (
          <div className="text-center mt-2">
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs"
            >
              Show more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

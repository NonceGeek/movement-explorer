"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/styling";
import JsonViewer from "@/components/ui/json-viewer";

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "rounded-lg transition-all duration-200 overflow-auto",
            isExpanded ? "max-h-[500px]" : "max-h-32",
          )}
        >
          <JsonViewer data={abi} initialDepth={isExpanded ? 2 : 1} />
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

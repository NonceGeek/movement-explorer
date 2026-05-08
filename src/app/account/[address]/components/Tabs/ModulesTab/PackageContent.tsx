"use client";

import { ReactNode, useState, useMemo } from "react";
import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import {
  Package,
  FileText,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { transformCode } from "@/utils";
import { CodeBlock } from "@/components/ui/CodeBlock";

interface PackageContentProps {
  address: string;
  packageMetadata: PackageMetadata;
  sidebarToggle?: ReactNode;
}

function getUpgradePolicyLabel(policy: number) {
  switch (policy) {
    case 0:
      return "Arbitrary";
    case 1:
      return "Compatible";
    case 2:
      return "Immutable";
    default:
      return "Unknown";
  }
}

export default function PackageContent({
  address,
  packageMetadata,
  sidebarToggle,
}: PackageContentProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const manifestText = useMemo(
    () =>
      packageMetadata.manifest
        ? transformCode(packageMetadata.manifest)
        : "",
    [packageMetadata.manifest],
  );

  const handleCopy = async () => {
    if (!manifestText) return;
    await navigator.clipboard.writeText(manifestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card backdrop-blur-sm rounded-xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          {/* Desktop breadcrumb: toggle / pkg / Package Manifest */}
          <div className="hidden md:flex items-center gap-1.5 min-w-0">
            {sidebarToggle}
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm font-medium truncate">
              {packageMetadata.name}
            </span>
            {manifestText && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">
                  Package Manifest
                </span>
              </>
            )}
          </div>
          {/* Mobile: just show name */}
          <span className="md:hidden font-mono text-sm font-medium truncate">
            {packageMetadata.name}
          </span>

          {/* Right side: badges + manifest actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">v{packageMetadata.upgrade_number}</Badge>
            <Badge variant="secondary">
              {getUpgradePolicyLabel(packageMetadata.upgrade_policy.policy)}
            </Badge>
            {manifestText && (
              <>
                <span className="hidden sm:block w-px h-4 bg-border" />
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
                        <span className="ml-1 text-xs hidden sm:inline">
                          {copied ? "Copied" : "Copy"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? "Code copied!" : "Copy manifest"}</p>
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
                  <span className="ml-1 text-xs hidden sm:inline">
                    {expanded ? "Collapse" : "Expand"}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Second row: Address + Source Digest */}
        <div className="grid gap-1 text-sm mt-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="shrink-0">Address:</span>
            <CopyableAddress address={address} showCopyButton showFull />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="shrink-0">Source Digest:</span>
            <CopyableAddress
              address={packageMetadata.source_digest}
              showCopyButton
              copyTooltip="Copy source digest"
              showFull
            />
          </div>
        </div>
      </CardHeader>

      {/* Manifest code block */}
      {manifestText && (
        <CardContent>
          <CodeBlock
            code={manifestText}
            language="toml"
            maxHeight={expanded ? "none" : "300px"}
          />
        </CardContent>
      )}
    </Card>
  );
}

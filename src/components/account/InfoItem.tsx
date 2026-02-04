import { ReactNode } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Copy, HelpCircle } from "lucide-react";
import { cn } from "@/utils/styling";
import { useState } from "react";

export interface InfoItemProps {
  label: string;
  value: string | ReactNode;
  subValue?: string;
  icon?: ReactNode;
  mono?: boolean;
  truncate?: boolean;
  copyable?: boolean;
  link?: string;
  tooltip?: string;
}

export function InfoItem({
  label,
  value,
  subValue,
  icon,
  mono = false,
  truncate = false,
  copyable = false,
  link,
  tooltip,
}: InfoItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof value === "string") {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const valueContent = (
    <span
      className={cn(
        mono && "font-mono",
        truncate && "truncate max-w-[200px]"
      )}
    >
      {value}
    </span>
  );

  return (
    <div className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
      {/* Left: Label */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="focus:outline-none">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Right: Value */}
      <div className="flex items-center gap-2 text-sm font-medium text-right">
        {link ? (
          <Link
            href={link}
            className="hover:text-primary hover:underline transition-colors"
          >
            {valueContent}
          </Link>
        ) : (
          valueContent
        )}
        {subValue && (
          <span className="text-muted-foreground text-xs">({subValue})</span>
        )}
        {copyable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

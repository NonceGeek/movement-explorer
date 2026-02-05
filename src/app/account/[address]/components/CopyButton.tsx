import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";
import { cn } from "@/utils/styling";

export interface CopyButtonProps {
  value: string;
  size?: "sm" | "md";
  className?: string;
}

export function CopyButton({
  value,
  size = "sm",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const buttonSize = size === "sm" ? "sm" : "default";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={buttonSize}
            className={cn("transition-all", className)}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className={cn(iconClass, "text-green-500")} />
            ) : (
              <Copy className={iconClass} />
            )}
            <span className="ml-2 text-sm">{copied ? "Copied!" : "Copy"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied to clipboard!" : "Copy to clipboard"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

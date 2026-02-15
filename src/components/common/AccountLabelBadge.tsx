"use client";

import { AccountLabelType } from "@/hooks/accounts/useGetAccountLabel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { cn } from "@/utils/styling";

export interface AccountLabelBadgeProps {
  accountLabel: { name: string | null; type: AccountLabelType } | null;
  /** default=带图标和Tooltip, compact=紧凑样式用于行内显示 */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * 账户标签徽章组件
 * 根据账户类型（VERIFIED/SCAM/ANS）显示不同样式的标签
 */
export function AccountLabelBadge({
  accountLabel,
  variant = "default",
  className,
}: AccountLabelBadgeProps) {
  if (!accountLabel || !accountLabel.name) {
    return null;
  }

  const { name, type } = accountLabel;

  // Compact variant - 用于 CopyableAddress 等行内场景
  if (variant === "compact") {
    const compactStyles = {
      [AccountLabelType.VERIFIED]: "bg-muted",
      [AccountLabelType.SCAM]: "bg-destructive/10 text-destructive",
      [AccountLabelType.ANS]: "bg-muted",
      [AccountLabelType.NONE]: "bg-muted",
    };

    return (
      <span
        className={cn(
          "px-3 py-1 rounded-sm font-mono text-sm",
          compactStyles[type],
          className
        )}
      >
        {name}
      </span>
    );
  }

  // Default variant - 用于 AccountTitle 等标题场景
  if (type === AccountLabelType.VERIFIED) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-byzantine-blue-300/10 text-byzantine-blue-300 text-sm font-medium",
                className
              )}
            >
              <span>{name}</span>
              <BadgeCheck className="h-5 w-5" fill="currentColor" stroke="white" strokeWidth={2} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a verified address label.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (type === AccountLabelType.SCAM) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium",
                className
              )}
            >
              <span>{name}</span>
              <ShieldAlert className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Warning: This is a known scam address.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (type === AccountLabelType.ANS) {
    return (
      <a
        href={`https://www.aptosnames.com/name/${name}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors",
          className
        )}
      >
        <span>{name}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return null;
}

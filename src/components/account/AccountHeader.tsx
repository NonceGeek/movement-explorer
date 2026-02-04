"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Star, Clock, BadgeCheck } from "lucide-react";
import { AccountIcon, type AccountType } from "./AccountIcon";
import { useGetAccountLabel } from "@/hooks/accounts/useGetAccountLabel";
import { cn } from "@/utils/styling";

export interface AccountHeaderProps {
  address: string;
  accountType: AccountType;
  isAccount?: boolean;
  isObject?: boolean;
  isToken?: boolean;
  isDeleted?: boolean;
  isVerified?: boolean;
  hasContract?: boolean;
  createdAt?: number;
  className?: string;
}

export function AccountHeader({
  address,
  accountType,
  isAccount = false,
  isObject = false,
  isToken = false,
  isDeleted = false,
  isVerified = false,
  hasContract = false,
  createdAt,
  className,
}: AccountHeaderProps) {
  const [copied, setCopied] = useState(false);
  const accountLabel = useGetAccountLabel(address);

  // Determine title
  let title = "Account";
  if (isToken) {
    title = isDeleted ? "Deleted Token Object" : "Token Object";
  } else if (isObject && !isAccount) {
    title = isDeleted ? "Deleted Object" : "Object";
  } else if (isDeleted) {
    title = "Deleted Account";
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  return (
    <Card
      className={cn(
        "bg-card/50 backdrop-blur-sm border-border/50",
        className
      )}
    >
      <CardContent className="p-6 lg:p-8">
        {/* Row 1: Icon + Title + Type Badge */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">
                {title}
              </h1>
              {hasContract && (
                <Badge variant="default" className="text-xs">
                  Contract
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Address + Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <code className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-md truncate max-w-full">
            {address}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          {/* <Button variant="ghost" size="sm" className="shrink-0">
            <QrCode className="h-4 w-4 mr-2" />
            QR
          </Button>
          <Button variant="outline" size="sm" className="shrink-0">
            <Star className="h-4 w-4 mr-2" />
            Watch
          </Button> */}
        </div>

        {/* Row 3: Status Badges & Metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          {isVerified && (
            <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {isDeleted && (
            <Badge variant="destructive">Deleted</Badge>
          )}
          {accountLabel?.name && (
            <Badge variant="secondary">{accountLabel.name}</Badge>
          )}
          {createdAt && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {formatTimeAgo(createdAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

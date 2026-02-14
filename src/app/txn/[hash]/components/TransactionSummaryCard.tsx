import { cn } from "@/utils/styling";
import { Badge } from "@/components/ui/badge";
import { formatTokenAmount, formatUSDValue } from "@/utils/formatters";
import { TimestampAge } from "@/components/common/TimestampAge";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Blocks, Coins } from "lucide-react";
import { EnhancedSkeleton } from "@/components/ui/skeleton";

interface TransactionSummaryCardProps {
  status: "success" | "failed";
  blockHeight?: string | number | null;
  timestamp?: string | null;
  amount?: {
    value: string | number | bigint;
    symbol?: string;
    decimals?: number;
  } | null;
  usdPrice?: number | null;
  isLoading?: boolean;
  className?: string;
}

export function TransactionSummaryCard({
  status,
  blockHeight,
  timestamp,
  amount,
  usdPrice,
  isLoading = false,
  className,
}: TransactionSummaryCardProps) {
  const formattedAmount = amount
    ? formatTokenAmount(amount.value, amount.decimals ?? 8)
    : null;
  const usdValue =
    amount && usdPrice
      ? formatUSDValue(amount.value, amount.decimals ?? 8, usdPrice)
      : null;

  return (
    <div
      className={cn(
        "bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 mb-6",
        className
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Status */}
        <SummaryItem
          icon={
            status === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )
          }
          label="Status"
          isLoading={isLoading}
        >
          <Badge
            variant={status === "success" ? "success" : "error"}
            className="font-semibold"
          >
            {status === "success" ? "Success" : "Failed"}
          </Badge>
        </SummaryItem>

        {/* Block */}
        <SummaryItem
          icon={<Blocks className="h-5 w-5 text-muted-foreground" />}
          label="Block"
          isLoading={isLoading}
        >
          {blockHeight ? (
            <Link
              href={`/block/${blockHeight}`}
              className="text-primary hover:underline font-semibold"
            >
              {blockHeight.toLocaleString()}
            </Link>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </SummaryItem>

        {/* Timestamp */}
        <SummaryItem
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          label="Timestamp"
          isLoading={isLoading}
        >
          {timestamp ? (
            <TimestampAge timestamp={timestamp} className="font-medium text-sm" />
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </SummaryItem>

        {/* Value */}
        <SummaryItem
          icon={<Coins className="h-5 w-5 text-muted-foreground" />}
          label="Value"
          isLoading={isLoading}
        >
          {formattedAmount ? (
            <div className="flex flex-col">
              <span className="font-semibold">
                {formattedAmount} {amount?.symbol ?? "MOVE"}
              </span>
              {usdValue && (
                <span className="text-xs text-muted-foreground">{usdValue}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </SummaryItem>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

function SummaryItem({ icon, label, children, isLoading }: SummaryItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
        {isLoading ? (
          <EnhancedSkeleton className="h-6 w-20" />
        ) : (
          <div className="text-foreground">{children}</div>
        )}
      </div>
    </div>
  );
}

import { cn } from "@/utils/styling";
import { formatTokenAmount, formatUSDValue } from "@/utils/formatters";
import { EnhancedSkeleton } from "@/components/ui/skeleton";

interface ValueWithUSDProps {
  amount: bigint | number | string;
  symbol?: string;
  decimals?: number;
  showUSD?: boolean;
  usdPrice?: number | null;
  isLoading?: boolean;
  className?: string;
  layout?: "inline" | "stacked";
}

export function ValueWithUSD({
  amount,
  symbol = "MOVE",
  decimals = 8,
  showUSD = true,
  usdPrice,
  isLoading = false,
  className,
  layout = "inline",
}: ValueWithUSDProps) {
  if (isLoading) {
    return <EnhancedSkeleton className="h-5 w-32" />;
  }

  const formattedAmount = formatTokenAmount(amount, decimals);
  const usdValue = showUSD ? formatUSDValue(amount, decimals, usdPrice ?? null) : null;

  if (layout === "stacked") {
    return (
      <div className={cn("flex flex-col", className)}>
        <span className="font-mono font-semibold">
          {formattedAmount} {symbol}
        </span>
        {usdValue && (
          <span className="text-sm text-muted-foreground">{usdValue}</span>
        )}
      </div>
    );
  }

  return (
    <span className={cn("font-mono", className)}>
      {formattedAmount} {symbol}
      {usdValue && (
        <span className="text-muted-foreground ml-2">({usdValue})</span>
      )}
    </span>
  );
}

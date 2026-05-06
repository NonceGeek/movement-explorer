import { cn } from "@/utils/styling";
import { formatGasValue, formatPercentage, formatUSDValue } from "@/utils/formatters";

interface GasUsageBarProps {
  gasUsed: string | number;
  maxGas: string | number;
  gasPrice?: string | number;
  gasFee?: string | number;
  usdPrice?: number | null;
  showFee?: boolean;
  className?: string;
}

export function GasUsageBar({
  gasUsed,
  maxGas,
  gasFee,
  usdPrice,
  showFee = true,
  className,
}: GasUsageBarProps) {
  const used = typeof gasUsed === "string" ? parseInt(gasUsed) : gasUsed;
  const max = typeof maxGas === "string" ? parseInt(maxGas) : maxGas;
  const percentage = max > 0 ? (used / max) * 100 : 0;

  const getProgressColor = (pct: number) => {
    if (pct < 50) return "bg-[var(--ms-good)] dark:bg-[var(--ms-ink-2)]";
    if (pct < 80) return "bg-yellow-500";
    return "bg-[var(--ms-bad)] dark:bg-[var(--ms-ink)]";
  };

  const feeValue = gasFee
    ? typeof gasFee === "string"
      ? parseInt(gasFee)
      : gasFee
    : 0;
  const usdFee = showFee && feeValue > 0 ? formatUSDValue(feeValue, 8, usdPrice ?? null) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm">
          {formatGasValue(used)} / {formatGasValue(max)}
        </span>
        <span className="text-muted-foreground text-sm">
          ({formatPercentage(percentage)})
        </span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden max-w-xs">
        <div
          className={cn(
            "h-full transition-all duration-300",
            getProgressColor(percentage)
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {showFee && gasFee && (
        <div className="text-sm text-muted-foreground">
          <span className="font-mono">
            Fee: {(feeValue / 1e8).toFixed(8)} MOVE
          </span>
          {usdFee && <span className="ml-2">({usdFee})</span>}
        </div>
      )}
    </div>
  );
}

// GasInfoCompact has been moved to @/components/common/GasInfoCompact
export { GasInfoCompact } from "@/components/common/GasInfoCompact";

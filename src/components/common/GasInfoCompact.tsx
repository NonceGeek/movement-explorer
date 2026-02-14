import { cn } from "@/utils/styling";
import { formatGasValue, formatPercentage, formatUSDValue } from "@/utils/formatters";

interface GasInfoCompactProps {
  gasUsed: string | number;
  maxGas?: string | number;
  gasPrice?: string | number;
  gasFee: string | number;
  usdPrice?: number | null;
  className?: string;
}

export function GasInfoCompact({
  gasUsed,
  maxGas,
  gasPrice,
  gasFee,
  usdPrice,
  className,
}: GasInfoCompactProps) {
  const used = typeof gasUsed === "string" ? parseInt(gasUsed) : gasUsed;
  const max = maxGas
    ? typeof maxGas === "string"
      ? parseInt(maxGas)
      : maxGas
    : 0;
  const percentage = max > 0 ? (used / max) * 100 : 0;
  const price = gasPrice
    ? typeof gasPrice === "string"
      ? parseInt(gasPrice)
      : gasPrice
    : null;
  const fee = typeof gasFee === "string" ? parseInt(gasFee) : gasFee;
  const usdFee = formatUSDValue(fee, 8, usdPrice ?? null);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1", className)}>
      <span className="text-sm">
        {formatGasValue(used)} Gas
        {max > 0 && (
          <span className="text-muted-foreground">
            {" "}
            ({formatPercentage(percentage)} of {formatGasValue(max)})
          </span>
        )}
      </span>
      {price !== null && (
        <span className="text-muted-foreground text-sm">
          @ {formatGasValue(price)} Octas
        </span>
      )}
      <span className="text-sm">
        = {(fee / 1e8).toFixed(8)} MOVE
        {usdFee && (
          <span className="text-muted-foreground ml-1">({usdFee})</span>
        )}
      </span>
    </div>
  );
}

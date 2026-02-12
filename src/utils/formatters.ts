/**
 * Format a token amount with its USD equivalent value
 */
export function formatUSDValue(
  amount: bigint | number | string,
  decimals: number,
  usdPrice: number | null
): string | null {
  if (!usdPrice) return null;

  const amountNum =
    typeof amount === "bigint"
      ? Number(amount) / Math.pow(10, decimals)
      : Number(amount) / Math.pow(10, decimals);

  const usdValue = amountNum * usdPrice;

  if (usdValue < 0.01 && usdValue > 0) {
    return "<$0.01";
  }

  return usdValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a token amount for display
 */
export function formatTokenAmount(
  amount: bigint | number | string,
  decimals: number = 8,
  maxDecimals?: number
): string {
  const amountNum =
    typeof amount === "bigint"
      ? Number(amount) / Math.pow(10, decimals)
      : Number(amount) / Math.pow(10, decimals);

  const effectiveMaxDecimals = maxDecimals ?? decimals;

  return amountNum.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: effectiveMaxDecimals,
  });
}

/**
 * Format a percentage value
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format gas values for display
 */
export function formatGasValue(value: string | number): string {
  const num = typeof value === "string" ? parseInt(value) : value;
  return num.toLocaleString("en-US");
}

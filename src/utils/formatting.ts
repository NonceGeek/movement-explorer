/**
 * Formatting utilities for numbers, currencies, and other data types
 */

/**
 * Format large numbers with K/M/B suffixes
 * @param value - Number to format
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted string (e.g., "1.2M", "456.8K", "2.3B")
 *
 * @example
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(1500000000) // "1.5B"
 * formatCompactNumber(456789, 2) // "456.79K"
 * formatCompactNumber(999) // "999"
 */
export function formatCompactNumber(
  value: number,
  decimals: number = 1
): string {
  const suffixes = [
    { value: 1e9, symbol: "B" }, // Billion
    { value: 1e6, symbol: "M" }, // Million
    { value: 1e3, symbol: "K" }, // Thousand
  ];

  for (const suffix of suffixes) {
    if (value >= suffix.value) {
      const formatted = (value / suffix.value).toFixed(decimals);
      // Remove trailing zeros after decimal point
      return formatted.replace(/\.0+$/, "") + suffix.symbol;
    }
  }

  // For numbers less than 1000, return with thousand separators
  return value.toLocaleString();
}

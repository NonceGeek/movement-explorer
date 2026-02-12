import {
  CoinAssetIcon,
  FaAssetIcon,
} from "@/app/account/[address]/components/Tabs/coins/CoinIcons";

export interface AssetCellProps {
  /** Asset ID - v1: "0x1::coin::AptosCoin", v2: "0xa" */
  assetId: string;
  /** Asset symbol - "MOVE", "USDC", etc. */
  symbol: string;
  /** Logo URL from coin list */
  logoUrl?: string | null;
  /** Whether to show subtext below symbol */
  showSubtext?: boolean;
  /** Custom subtext (defaults to derived from assetId) */
  subtext?: string;
  /** Maximum width for truncation */
  maxWidth?: string;
}

/**
 * AssetCell - Universal component for displaying asset with logo and symbol
 *
 * Displays:
 * - Asset logo (v1 Coin or v2 FA with appropriate fallbacks)
 * - Asset symbol
 * - Optional subtext (asset type or custom text)
 *
 * Used in:
 * - Balance Change Table
 * - Account Coins Table
 * - Any table displaying assets
 */
export function AssetCell({
  assetId,
  symbol,
  logoUrl,
  showSubtext = true,
  subtext,
  maxWidth = "150px",
}: AssetCellProps) {
  // Determine if asset is v1 Coin or v2 FA
  const isCoin = assetId.includes("::");

  // Default subtext: module name for v1 Coins, "FA" for v2
  const defaultSubtext = isCoin
    ? assetId.split("::")[1] || assetId
    : "FA";

  const displaySubtext = subtext ?? defaultSubtext;

  return (
    <div className="flex items-center gap-2">
      {/* Asset Logo */}
      {isCoin ? (
        <CoinAssetIcon logoUrl={logoUrl ?? null} symbol={symbol} />
      ) : (
        <FaAssetIcon
          address={assetId}
          fallbackLogoUrl={logoUrl ?? null}
          symbol={symbol}
        />
      )}

      {/* Asset Symbol and Type */}
      <div className="flex flex-col">
        <span
          className="font-medium text-sm truncate"
          style={{ maxWidth }}
          title={symbol}
        >
          {symbol}
        </span>
        {showSubtext && (
          <span
            className="text-xs text-muted-foreground truncate"
            style={{ maxWidth }}
            title={assetId}
          >
            {displaySubtext}
          </span>
        )}
      </div>
    </div>
  );
}

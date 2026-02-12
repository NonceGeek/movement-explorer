import { CoinVerificationBadge } from "@/app/account/[address]/components/Tabs/coins/CoinVerificationBadge";
import { verifiedLevel, VerifiedLevelInfo } from "@/utils/coinVerification";
import { useGlobalStore } from "@/store/useGlobalStore";
import { CoinDescription } from "@/hooks/coins/types";

export interface VerificationCellProps {
  /** Asset ID for verification lookup */
  assetId: string;
  /** Whether asset is in coin list */
  known: boolean;
  /** Asset symbol */
  symbol?: string;
  /** Whether asset is banned */
  isBanned?: boolean;
  /** Whether asset is in Panora token list */
  isInPanoraTokenList?: boolean;
  /** Panora tags from coin list */
  panoraTags?: CoinDescription["panoraTags"];
  /** Pre-calculated verification (optional, skips calculation) */
  verification?: VerifiedLevelInfo;
}

/**
 * VerificationCell - Universal component for asset verification badge
 *
 * Features:
 * - Automatically calculates verification level using network context
 * - Displays appropriate badge (Native, Verified, Banned, etc.)
 * - Handles all verification logic in one place
 *
 * Used in:
 * - Balance Change Table
 * - Account Coins Table
 * - Any table displaying asset verification
 */
export function VerificationCell({
  assetId,
  known,
  symbol,
  isBanned,
  isInPanoraTokenList,
  panoraTags,
  verification: preCalculatedVerification,
}: VerificationCellProps) {
  const { network_name } = useGlobalStore();

  // Use pre-calculated verification or calculate it
  const verification =
    preCalculatedVerification ??
    verifiedLevel(
      {
        id: assetId,
        known,
        isBanned,
        isInPanoraTokenList,
        symbol,
        panoraTags,
      },
      network_name,
    );

  return <CoinVerificationBadge verification={verification} />;
}

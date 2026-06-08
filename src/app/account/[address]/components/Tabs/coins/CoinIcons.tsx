import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { TokenIcon } from "@/components/common/TokenIcon";

function isMoveSymbol(symbol: string) {
  return symbol === "MOVE" || symbol === "AptosCoin";
}

export function AssetIconFallback({
  symbol,
  className = "h-6 w-6",
}: {
  symbol: string;
  className?: string;
}) {
  if (isMoveSymbol(symbol)) {
    return (
      <TokenIcon
        src="/coinLogo.png"
        symbol="MOVE"
        alt="MOVE"
        className={className}
      />
    );
  }

  return <TokenIcon symbol={symbol} className={className} />;
}

export function CoinAssetIcon({
  logoUrl,
  symbol,
  className = "h-6 w-6",
}: {
  logoUrl: string | null;
  symbol: string;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <TokenIcon
        src={logoUrl}
        symbol={symbol}
        alt={symbol || "Coin"}
        className={className}
      />
    );
  }

  return <AssetIconFallback symbol={symbol} className={className} />;
}

export function FaAssetIcon({
  address,
  fallbackLogoUrl,
  symbol,
  className = "h-6 w-6",
}: {
  address: string;
  fallbackLogoUrl: string | null;
  symbol: string;
  className?: string;
}) {
  const { data } = useGetFaMetadata(address);
  const iconUrl =
    data?.icon_uri ||
    fallbackLogoUrl ||
    (isMoveSymbol(symbol) ? "/coinLogo.png" : null);

  if (iconUrl) {
    return (
      <TokenIcon
        src={iconUrl}
        symbol={symbol}
        alt={symbol || "FA"}
        className={className}
      />
    );
  }

  return <AssetIconFallback symbol={symbol} className={className} />;
}

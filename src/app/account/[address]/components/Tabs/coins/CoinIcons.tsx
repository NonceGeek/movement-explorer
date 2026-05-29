import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { TokenIcon } from "@/components/common/TokenIcon";

export function AssetIconFallback({ symbol }: { symbol: string }) {
  return <TokenIcon symbol={symbol} className="h-6 w-6" />;
}

export function CoinAssetIcon({
  logoUrl,
  symbol,
}: {
  logoUrl: string | null;
  symbol: string;
}) {
  if (logoUrl) {
    return (
      <TokenIcon
        src={logoUrl}
        symbol={symbol}
        alt={symbol || "Coin"}
        className="h-6 w-6"
      />
    );
  }

  return <AssetIconFallback symbol={symbol} />;
}

export function FaAssetIcon({
  address,
  fallbackLogoUrl,
  symbol,
}: {
  address: string;
  fallbackLogoUrl: string | null;
  symbol: string;
}) {
  const { data } = useGetFaMetadata(address);
  const iconUrl = data?.icon_uri || fallbackLogoUrl;

  if (iconUrl) {
    return (
      <TokenIcon
        src={iconUrl}
        symbol={symbol}
        alt={symbol || "FA"}
        className="h-6 w-6"
      />
    );
  }

  return <AssetIconFallback symbol={symbol} />;
}

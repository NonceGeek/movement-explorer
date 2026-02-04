import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { Coins } from "lucide-react";

export function AssetIconFallback({ symbol }: { symbol: string }) {
  const text = symbol ? symbol.slice(0, 2).toUpperCase() : "";
  return (
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
      {text ? text : <Coins className="h-4 w-4" />}
    </div>
  );
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
      <img
        src={logoUrl}
        alt={symbol || "Coin"}
        className="h-6 w-6 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
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
      <img
        src={iconUrl}
        alt={symbol || "FA"}
        className="h-6 w-6 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return <AssetIconFallback symbol={symbol} />;
}

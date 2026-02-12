import Link from "next/link";
import { TableCell, StyledTableRow as TableRow } from "@/components/ui/table";
import { CoinAssetIcon, FaAssetIcon } from "./CoinIcons";
import { CoinVerificationBadge } from "./CoinVerificationBadge";
import { CoinRow as CoinRowType } from "./types";
import { CopyableAddress } from "@/components/common/CopyableAddress";

export function CoinRow({ coin }: { coin: CoinRowType }) {
  const isStruct = coin.assetType.includes("::");
  const href = isStruct
    ? `/coin/${encodeURIComponent(coin.assetType)}`
    : `/fa/${encodeURIComponent(coin.assetType)}`;
  const assetTypeLabel =
    coin.tokenStandard === "v1"
      ? "Coin"
      : coin.tokenStandard === "v2"
        ? "Fungible Asset"
        : coin.tokenStandard;
  const isFA = coin.tokenStandard === "v2";

  return (
    <TableRow>
      <TableCell>
        <Link href={href} className="text-primary hover:underline">
          {coin.name} ({coin.symbol})
        </Link>
      </TableCell>
      <TableCell>{assetTypeLabel}</TableCell>
      <TableCell className="font-mono text-sm">
        <div className="inline-flex items-center gap-2">
          {isFA ? (
            <FaAssetIcon
              address={coin.assetType}
              fallbackLogoUrl={coin.logoUrl}
              symbol={coin.symbol}
            />
          ) : (
            <CoinAssetIcon logoUrl={coin.logoUrl} symbol={coin.symbol} />
          )}
          <CopyableAddress
            address={coin.assetType}
            href={href}
            showCopyButton={false}
            truncateLength={{ start: 30, end: 15 }}
            showFull={coin.assetType.length <= 30}
            variant="default"
          />
        </div>
      </TableCell>
      <TableCell>
        <CoinVerificationBadge verification={coin.verification} />
      </TableCell>
      <TableCell className="text-right uppercase">
        {coin.tokenStandard}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {coin.amount.toLocaleString("en-US", {
          maximumFractionDigits: coin.decimals,
        })}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {coin.usdPrice !== null
          ? coin.usdPrice.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })
          : "-"}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {coin.usdValue !== null
          ? coin.usdValue.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })
          : "-"}
      </TableCell>
    </TableRow>
  );
}

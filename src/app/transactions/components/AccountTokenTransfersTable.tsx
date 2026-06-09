"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Types } from "aptos";
import { SearchX, CircleCheckBig, XCircle } from "lucide-react";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import { TransactionFunction } from "@/components/common/TransactionFunction";
import { AssetCell } from "@/components/common/AssetCell";
import { TransactionTypeTooltip } from "@/components/common/TransactionTypeTooltip";
import { parseTransactionActions } from "@/app/txn/[hash]/components";
import type { ParsedAction } from "@/app/txn/[hash]/components";
import {
  formatMoveAmount,
  getTransactionAmount,
  getTransactionCounterparty,
  getTransactionDirection,
  getTransactionToken,
} from "@/utils/transaction";
import { cn } from "@/utils/styling";
import { tryStandardizeAddress } from "@/utils";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { CoinDescription } from "@/hooks/coins/types";
import { getAssetSymbol } from "@/utils/transaction";
import type { AccountFungibleAssetActivity } from "@/hooks/accounts/useGetFungibleAssetActivitiesByVersions";
import type { ColumnFilters } from "@/components/transactions";

type TokenTransferRow = {
  id: string;
  transaction: Types.Transaction;
  activity?: AccountFungibleAssetActivity;
  activities: AccountFungibleAssetActivity[];
  from?: string;
  to?: string;
  direction: "in" | "out" | "self" | "call" | "related";
};

type AccountTokenTransfersTableProps = {
  relatedActivities: AccountFungibleAssetActivity[];
  transactions: Types.Transaction[];
  address: string;
  assetType?: string | null;
  isLoading?: boolean;
  loadingRowCount?: number;
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: () => void;
  columnFilters?: ColumnFilters;
};

const COLUMNS = [
  { key: "hash", label: "Transaction Hash", width: "w-[170px]" },
  { key: "function", label: "Function", width: "w-[120px]" },
  { key: "timestamp", label: "Age", width: "w-[155px]" },
  { key: "from", label: "From", width: "w-[145px]" },
  { key: "direction", label: "", width: "w-[75px]" },
  { key: "to", label: "To", width: "w-[150px]" },
  { key: "amount", label: "Amount", width: "w-[210px]" },
  { key: "token", label: "Token", width: "w-[150px]" },
] as const;

function isMoveAssetType(assetType: string | undefined) {
  return (
    assetType === "0x1::aptos_coin::AptosCoin" ||
    assetType === "0xa" ||
    assetType?.startsWith(
      "0x000000000000000000000000000000000000000000000000000000000000000a",
    )
  );
}

function normalizeAssetType(assetType: string | undefined) {
  if (!assetType) return undefined;
  if (isMoveAssetType(assetType)) return "MOVE";
  return assetType.includes("::")
    ? assetType
    : (tryStandardizeAddress(assetType) ?? assetType);
}

function isSameAssetType(left: string | undefined, right: string | undefined) {
  const normalizedLeft = normalizeAssetType(left);
  const normalizedRight = normalizeAssetType(right);

  return !!normalizedLeft && normalizedLeft === normalizedRight;
}

function normalizeTokenSymbol(
  symbol: string | null | undefined,
  assetType?: string,
) {
  if (isMoveAssetType(assetType) || symbol === "AptosCoin") {
    return "MOVE";
  }

  if (symbol === "FA" || symbol === "Metadata") {
    return null;
  }

  return symbol || null;
}

function isWithdraw(activity: AccountFungibleAssetActivity) {
  return activity.type.toLowerCase().includes("withdraw");
}

function isDeposit(activity: AccountFungibleAssetActivity) {
  return activity.type.toLowerCase().includes("deposit");
}

function findCoinData(coins: CoinDescription[] | undefined, assetType: string) {
  return coins?.find(
    (coin) => coin.tokenAddress === assetType || coin.faAddress === assetType,
  );
}

function fallbackTokenLabel(assetType: string | undefined) {
  if (!assetType) return "Unknown Token";
  if (isMoveAssetType(assetType)) return "MOVE";
  if (assetType.includes("::")) {
    const lastSegment = assetType.split("::").pop();
    if (lastSegment === "AptosCoin") return "MOVE";
    if (lastSegment === "Metadata")
      return `${assetType.slice(0, 6)}...${assetType.slice(-4)}`;
    return lastSegment || "Unknown Token";
  }
  return `${assetType.slice(0, 6)}...${assetType.slice(-4)}`;
}

function getDirectionFromAddresses(
  currentAddress: string,
  from?: string,
  to?: string,
): TokenTransferRow["direction"] | undefined {
  const currentStd = tryStandardizeAddress(currentAddress);
  const fromStd = from ? tryStandardizeAddress(from) : null;
  const toStd = to ? tryStandardizeAddress(to) : null;

  if (!currentStd || (!fromStd && !toStd)) return undefined;
  if (fromStd === currentStd && toStd === currentStd) return "self";
  if (fromStd === currentStd) return "out";
  if (toStd === currentStd) return "in";
  return "related";
}

function findCounterpartyActivity(
  activity: AccountFungibleAssetActivity,
  allActivities: AccountFungibleAssetActivity[],
) {
  const needsDeposit = isWithdraw(activity);
  const needsWithdraw = isDeposit(activity);

  if (!needsDeposit && !needsWithdraw) return undefined;

  return allActivities.find((candidate) => {
    if (candidate.event_index === activity.event_index) return false;
    if (candidate.transaction_version !== activity.transaction_version)
      return false;
    if (candidate.asset_type !== activity.asset_type) return false;
    if (candidate.amount !== activity.amount) return false;
    return needsDeposit ? isDeposit(candidate) : isWithdraw(candidate);
  });
}

function buildRows({
  relatedActivities,
  transactions,
  address,
  assetType,
}: Pick<
  AccountTokenTransfersTableProps,
  "relatedActivities" | "transactions" | "address" | "assetType"
>): TokenTransferRow[] {
  const currentAddress = tryStandardizeAddress(address);
  const byVersion = new Map<number, AccountFungibleAssetActivity[]>();
  for (const activity of relatedActivities) {
    const version = Number(activity.transaction_version);
    const group = byVersion.get(version) ?? [];
    group.push(activity);
    byVersion.set(version, group);
  }

  return transactions.map((transaction) => {
    const version = "version" in transaction ? Number(transaction.version) : 0;
    const group = byVersion.get(version) ?? [];
    const accountActivities = group.filter((activity) => {
      const owner = tryStandardizeAddress(activity.owner_address);
      return currentAddress && owner === currentAddress;
    });
    const matchingAssetActivities = assetType
      ? accountActivities.filter((activity) =>
          isSameAssetType(activity.asset_type, assetType),
        )
      : accountActivities;
    const candidateActivities =
      matchingAssetActivities.length > 0
        ? matchingAssetActivities
        : accountActivities.length > 0
          ? accountActivities
          : group;
    const deposits = candidateActivities.filter((activity) =>
      isDeposit(activity),
    );
    const selected =
      deposits.find((activity) => !isMoveAssetType(activity.asset_type)) ??
      deposits[0] ??
      candidateActivities.find(
        (activity) => !isMoveAssetType(activity.asset_type),
      ) ??
      candidateActivities.find((activity) => isWithdraw(activity)) ??
      candidateActivities[0];

    let from: string | undefined;
    let to: string | undefined;
    let direction: TokenTransferRow["direction"] = "related";

    if (selected) {
      const counterparty = findCounterpartyActivity(selected, group);
      from = isWithdraw(selected)
        ? selected.owner_address
        : counterparty?.owner_address;
      to = isDeposit(selected)
        ? selected.owner_address
        : counterparty?.owner_address;
      const fromStd = from ? tryStandardizeAddress(from) : null;
      const toStd = to ? tryStandardizeAddress(to) : null;

      direction =
        currentAddress && fromStd === currentAddress && toStd === currentAddress
          ? "self"
          : currentAddress && fromStd === currentAddress
            ? "out"
            : currentAddress && toStd === currentAddress
              ? "in"
              : "related";
    } else {
      const counterparty = getTransactionCounterparty(transaction);
      from = "sender" in transaction ? transaction.sender : undefined;
      to = counterparty?.address;
      direction = getTransactionDirection(transaction, address);
    }

    return {
      id: String(version),
      activity: selected,
      activities: candidateActivities,
      transaction,
      from,
      to,
      direction,
    };
  });
}

function DirectionBadge({
  direction,
}: {
  direction: TokenTransferRow["direction"];
}) {
  const config = {
    out: {
      label: "OUT",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
    in: {
      label: "IN",
      className: "bg-(--ms-good)/15 text-(--ms-good) border-(--ms-good)/30",
    },
    self: {
      label: "SELF",
      className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    },
    call: {
      label: "CALL",
      className: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    },
    related: {
      label: "RELATED",
      className: "bg-muted text-muted-foreground border-border",
    },
  }[direction];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function EmptyRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMNS.length} className="h-40">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-muted/30 rounded-full">
            <SearchX className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/70">
              No matching results
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Try adjusting or clearing your filters
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function getActivitySymbol(
  activity: AccountFungibleAssetActivity,
  coins?: CoinDescription[],
) {
  const coin = findCoinData(coins, activity.asset_type);
  return (
    normalizeTokenSymbol(
      getAssetSymbol(
        coin?.panoraSymbol ?? undefined,
        coin?.bridge ?? undefined,
        coin?.symbol ?? activity.metadata?.symbol,
      ),
      activity.asset_type,
    ) ?? fallbackTokenLabel(activity.asset_type)
  );
}

function formatActivityAmount(activity: AccountFungibleAssetActivity) {
  return formatMoveAmount(activity.amount, activity.metadata?.decimals ?? 8);
}

function TokenNumericAmount({
  amount,
  metadataAddress,
}: {
  amount: string;
  metadataAddress?: string;
}) {
  const { data: metadata } = useGetFaMetadata(metadataAddress || "");
  const formattedAmount = metadata
    ? formatMoveAmount(amount, metadata.decimals)
    : amount;

  return <span>{formattedAmount}</span>;
}

function InlineActivityAmountText({
  activity,
}: {
  activity: AccountFungibleAssetActivity;
}) {
  return <span>{formatActivityAmount(activity)}</span>;
}

function InlineFallbackAmountText({ amount }: { amount: bigint }) {
  return <span>{formatMoveAmount(amount)}</span>;
}

function TransferAmount({
  row,
  fallbackAmount,
  swapAction,
  transferAction,
  suppressFallback,
}: {
  row: TokenTransferRow;
  fallbackAmount: bigint | undefined;
  swapAction?: ParsedAction;
  transferAction?: ParsedAction;
  suppressFallback?: boolean;
}) {
  if (
    swapAction?.type === "swap" &&
    swapAction.details?.amountIn &&
    swapAction.details?.amountOut
  ) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <TokenNumericAmount
          amount={swapAction.details.amountIn}
          metadataAddress={swapAction.details.metadataIn}
        />
        <TokenNumericAmount
          amount={swapAction.details.amountOut}
          metadataAddress={swapAction.details.metadataOut}
        />
      </div>
    );
  }

  if (
    transferAction?.type === "transfer" &&
    transferAction.details?.metadata &&
    transferAction.details?.amount
  ) {
    return (
      <TokenNumericAmount
        amount={transferAction.details.amount}
        metadataAddress={transferAction.details.metadata}
      />
    );
  }

  const withdrawals = row.activities.filter((activity) => isWithdraw(activity));
  const deposits = row.activities.filter((activity) => isDeposit(activity));
  const primaryWithdraw = withdrawals[0];
  const primaryDeposit =
    deposits.find(
      (activity) => activity.asset_type !== primaryWithdraw?.asset_type,
    ) ?? deposits[0];

  if (primaryWithdraw && primaryDeposit) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <InlineActivityAmountText activity={primaryWithdraw} />
        <InlineActivityAmountText activity={primaryDeposit} />
      </div>
    );
  }

  const single = row.activity ?? primaryWithdraw ?? primaryDeposit;
  if (single) {
    return <InlineActivityAmountText activity={single} />;
  }

  if (!suppressFallback && fallbackAmount !== undefined) {
    return <InlineFallbackAmountText amount={fallbackAmount} />;
  }

  return <span className="text-muted-foreground">-</span>;
}

function MetadataAssetCell({
  metadataAddress,
  fallbackSymbol,
  maxWidth = "110px",
}: {
  metadataAddress?: string;
  fallbackSymbol?: string;
  maxWidth?: string;
}) {
  const { data: metadata } = useGetFaMetadata(metadataAddress || "");
  const symbol =
    normalizeTokenSymbol(metadata?.symbol ?? fallbackSymbol, metadataAddress) ??
    fallbackTokenLabel(metadataAddress);

  if (!metadataAddress) {
    return <span className="text-sm text-foreground/80">{symbol}</span>;
  }

  return (
    <AssetCell
      assetId={metadataAddress}
      symbol={symbol}
      logoUrl={metadata?.icon_uri}
      showSubtext={false}
      maxWidth={maxWidth}
      iconClassName="h-4 w-4"
    />
  );
}

function SwapTokenLabel({ action }: { action: ParsedAction }) {
  if (!action.details?.metadataIn && !action.details?.metadataOut) {
    return <span className="text-sm text-foreground/80">Multi-token</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <MetadataAssetCell
        metadataAddress={action.details?.metadataIn}
        maxWidth="82px"
      />
      <MetadataAssetCell
        metadataAddress={action.details?.metadataOut}
        maxWidth="82px"
      />
    </div>
  );
}

function TransferTokenLabel({ action }: { action: ParsedAction }) {
  return (
    <MetadataAssetCell
      metadataAddress={action.details?.metadata}
      fallbackSymbol={action.details?.symbol}
    />
  );
}

function ActivityAssetCell({
  activity,
  coins,
}: {
  activity: AccountFungibleAssetActivity;
  coins?: CoinDescription[];
}) {
  const symbol = getActivitySymbol(activity, coins);
  const coin = findCoinData(coins, activity.asset_type);

  return (
    <AssetCell
      assetId={activity.asset_type}
      symbol={symbol}
      logoUrl={coin?.logoUrl}
      showSubtext={false}
      maxWidth="120px"
      iconClassName="h-4 w-4"
    />
  );
}

function ActivityTokenLabel({
  row,
  coins,
}: {
  row: TokenTransferRow;
  coins?: CoinDescription[];
}) {
  const withdrawals = row.activities.filter((activity) => isWithdraw(activity));
  const deposits = row.activities.filter((activity) => isDeposit(activity));
  const primaryWithdraw = withdrawals[0];
  const primaryDeposit =
    deposits.find(
      (activity) => activity.asset_type !== primaryWithdraw?.asset_type,
    ) ?? deposits[0];

  if (primaryWithdraw && primaryDeposit) {
    return (
      <div className="flex flex-col gap-1">
        <ActivityAssetCell activity={primaryWithdraw} coins={coins} />
        <ActivityAssetCell activity={primaryDeposit} coins={coins} />
      </div>
    );
  }

  const single = row.activity ?? primaryWithdraw ?? primaryDeposit;
  if (!single) return null;

  return <ActivityAssetCell activity={single} coins={coins} />;
}

export function AccountTokenTransfersTable({
  relatedActivities,
  transactions,
  address,
  assetType,
  isLoading = false,
  loadingRowCount = 10,
  timestampMode,
  onToggleTimestampMode,
  columnFilters,
}: AccountTokenTransfersTableProps) {
  const router = useRouter();
  const { data: coinListData } = useGetCoinList();
  const coins = coinListData?.data;
  const rows = useMemo(
    () =>
      buildRows({
        relatedActivities,
        transactions,
        address,
        assetType,
      }),
    [relatedActivities, transactions, address, assetType],
  );

  const renderHeaderLabel = (column: (typeof COLUMNS)[number]) => {
    if (column.key === "hash") {
      return (
        <div className="flex items-center gap-1">
          <TransactionTypeTooltip />
          {column.label}
        </div>
      );
    }

    if (column.key === "timestamp") {
      return columnFilters?.timestamp ?? column.label;
    }

    if (column.key === "token") {
      return columnFilters?.token ?? column.label;
    }

    if (column.key === "from") {
      return columnFilters?.sender ?? column.label;
    }

    return column.label;
  };

  if (isLoading) {
    return (
      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            {COLUMNS.map((column) => (
              <StyledTableHead key={column.key} className={column.width}>
                {renderHeaderLabel(column)}
              </StyledTableHead>
            ))}
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <TableBody>
          {Array.from({ length: loadingRowCount }).map((_, i) => (
            <TableRow key={i} className="h-16">
              {COLUMNS.map((column) => (
                <TableCell key={column.key} className={column.width}>
                  <EnhancedSkeleton className="h-8 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    );
  }

  return (
    <StyledTable>
      <StyledTableHeader>
        <StyledTableHeaderRow>
          {COLUMNS.map((column) => (
            <StyledTableHead
              key={column.key}
              className={cn(
                column.width,
                column.key === "amount" && "text-right",
              )}
            >
              {renderHeaderLabel(column)}
            </StyledTableHead>
          ))}
        </StyledTableHeaderRow>
      </StyledTableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow />
        ) : (
          rows.map((row) => {
            const { activity, transaction } = row;
            const actions = parseTransactionActions(transaction);
            const swapAction = actions.find((action) => action.type === "swap");
            const parsedTransferAction = actions.find(
              (action) =>
                action.type === "transfer" &&
                !!action.details?.metadata &&
                !!action.details?.amount,
            );
            const transferAction =
              parsedTransferAction &&
              (!activity ||
                isSameAssetType(
                  parsedTransferAction.details?.metadata,
                  activity.asset_type,
                ))
                ? parsedTransferAction
                : undefined;
            const displayFrom = transferAction?.details?.from ?? row.from;
            const displayTo = transferAction?.details?.to ?? row.to;
            const displayDirection =
              transferAction && (displayFrom || displayTo)
                ? (getDirectionFromAddresses(address, displayFrom, displayTo) ??
                  row.direction)
                : row.direction;
            const txHash = transaction.hash || row.id;
            const status =
              transaction && "success" in transaction
                ? transaction.success
                : true;
            const symbol = activity
              ? getActivitySymbol(activity, coins)
              : (normalizeTokenSymbol(getTransactionToken(transaction)) ??
                "MOVE");
            const fallbackAmount = getTransactionAmount(transaction);

            return (
              <StyledTableRow
                key={row.id}
                className="cursor-pointer animate-in slide-in-from-top-2 fade-in duration-500"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('a, button, [role="button"]')) return;
                  router.push(`/txn/${txHash}`);
                }}
              >
                <TableCell className={COLUMNS[0].width}>
                  <CopyableAddress
                    address={transaction.hash || row.id}
                    href={`/txn/${txHash}`}
                    className="text-primary font-mono transition-colors"
                    truncateLength={{ start: 10, end: 0 }}
                    icon={
                      status ? (
                        <CircleCheckBig className="h-4 w-4 text-(--ms-good) shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )
                    }
                  />
                </TableCell>
                <TableCell className={COLUMNS[1].width}>
                  <TransactionFunction
                    transaction={transaction}
                    entryFunctionIdStr={activity?.entry_function_id_str}
                  />
                </TableCell>
                <TableCell
                  className={cn(
                    COLUMNS[2].width,
                    "text-foreground/80 text-sm whitespace-nowrap",
                  )}
                >
                  <TimestampToggle
                    timestamp={
                      "timestamp" in transaction ? transaction.timestamp : null
                    }
                    timestampMode={timestampMode}
                    onToggle={onToggleTimestampMode}
                  />
                </TableCell>
                <TableCell className={COLUMNS[3].width}>
                  {displayFrom ? (
                    <CopyableAddress
                      address={displayFrom}
                      href={`/account/${displayFrom}`}
                      className="text-primary"
                      showLabel
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className={COLUMNS[4].width}>
                  <DirectionBadge direction={displayDirection} />
                </TableCell>
                <TableCell className={COLUMNS[5].width}>
                  {displayTo ? (
                    <CopyableAddress
                      address={displayTo}
                      href={`/account/${displayTo}`}
                      className="text-primary"
                      showLabel
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    COLUMNS[6].width,
                    "text-right font-mono tabular-nums",
                  )}
                >
                  <TransferAmount
                    row={row}
                    fallbackAmount={fallbackAmount}
                    swapAction={swapAction}
                    transferAction={transferAction}
                    suppressFallback={!!assetType && !activity}
                  />
                </TableCell>
                <TableCell className={COLUMNS[7].width}>
                  {swapAction ? (
                    <SwapTokenLabel action={swapAction} />
                  ) : transferAction ? (
                    <TransferTokenLabel action={transferAction} />
                  ) : activity ? (
                    <ActivityTokenLabel row={row} coins={coins} />
                  ) : assetType ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : (
                    <span className="text-sm text-foreground/80">{symbol}</span>
                  )}
                </TableCell>
              </StyledTableRow>
            );
          })
        )}
      </TableBody>
    </StyledTable>
  );
}

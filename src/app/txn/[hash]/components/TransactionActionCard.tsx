"use client";

import { CopyableAddress } from "@/components/common/CopyableAddress";
import { formatMoveAmount } from "@/utils/transaction";
import { formatMovementPath } from "@/utils";
import {
  ArrowRight,
  ArrowLeftRight,
  Image,
  Flame,
  Send,
  FileCode,
  Coins,
  Package,
} from "lucide-react";
import { cn } from "@/utils/styling";
import type { Types } from "aptos";
import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import {
  useGetPackageName,
  extractPackageAddress,
} from "@/hooks/accounts/useGetPackageName";

export interface ParsedAction {
  type:
    | "transfer"
    | "swap"
    | "nft_mint"
    | "nft_burn"
    | "object_transfer"
    | "contract_call"
    | "stake"
    | "unstake"
    | "claim";
  description: string;
  details?: {
    from?: string;
    to?: string;
    amount?: string;
    symbol?: string;
    amountIn?: string;
    amountOut?: string;
    symbolIn?: string;
    symbolOut?: string;
    metadataIn?: string;  // FA metadata address for input token
    metadataOut?: string; // FA metadata address for output token
    dex?: string;         // Fallback DEX name (hardcoded)
    dexEventType?: string; // Original event type for dynamic package name lookup
    collection?: string;
    token?: string;
    object?: string;
    contract?: string;
    function?: string;
    isMultiHop?: boolean; // Flag for multi-hop swaps
  };
}

const ACTION_ICONS: Record<ParsedAction["type"], React.ReactNode> = {
  transfer: <Send className="h-5 w-5" />,
  swap: <ArrowLeftRight className="h-5 w-5" />,
  nft_mint: <Image className="h-5 w-5" />,
  nft_burn: <Flame className="h-5 w-5" />,
  object_transfer: <Package className="h-5 w-5" />,
  contract_call: <FileCode className="h-5 w-5" />,
  stake: <Coins className="h-5 w-5" />,
  unstake: <Coins className="h-5 w-5" />,
  claim: <Coins className="h-5 w-5" />,
};

const ACTION_COLORS: Record<ParsedAction["type"], string> = {
  transfer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  swap: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  nft_mint: "bg-green-500/10 text-green-500 border-green-500/20",
  nft_burn: "bg-red-500/10 text-red-500 border-red-500/20",
  object_transfer: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  contract_call: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  stake: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  unstake: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  claim: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

// Helper: Extract FA metadata address from store address using changes
function extractMetadataFromStore(
  storeAddress: string,
  changes: Types.WriteSetChange[]
): string | undefined {
  if (!storeAddress) return undefined;

  // Special case: MOVE token
  if (storeAddress.toLowerCase().includes("0xa") ||
      storeAddress === "0x000000000000000000000000000000000000000000000000000000000000000a") {
    return "0xa";
  }

  // Find FungibleStore resource in changes
  for (const change of changes) {
    if (
      (change.type === "write_resource" || change.type === "create_resource") &&
      "address" in change &&
      change.address &&
      change.address.toLowerCase() === storeAddress.toLowerCase()
    ) {
      const changeWithData = change as {
        data?: {
          type?: string;
          data?: {
            metadata?: { inner?: string };
          };
        };
      };

      if (
        changeWithData.data?.type === "0x1::fungible_asset::FungibleStore" &&
        changeWithData.data?.data?.metadata?.inner
      ) {
        return changeWithData.data.data.metadata.inner;
      }
    }
  }

  return undefined;
}

// Helper: Intelligently extract swap amounts from event data
// This handles various DEX field naming patterns
function extractSwapAmounts(swapData: any): {
  amountIn?: string;
  amountOut?: string;
} {
  if (!swapData) return {};

  // Strategy 1: Try common field name patterns
  const amountIn =
    swapData.amount_in ||
    swapData.amount_x_in ||
    swapData.amountIn ||
    swapData.x_in ||
    swapData.coin_x_in ||
    (swapData.amount0_in && swapData.amount0_in !== "0"
      ? swapData.amount0_in
      : swapData.amount1_in);

  const amountOut =
    swapData.amount_out ||
    swapData.amount_y_out ||
    swapData.amountOut ||
    swapData.y_out ||
    swapData.coin_y_out ||
    (swapData.amount0_out && swapData.amount0_out !== "0"
      ? swapData.amount0_out
      : swapData.amount1_out);

  // Strategy 2: If still no amounts found, intelligently scan all fields
  if (!amountIn || !amountOut) {
    const foundAmounts = findAmountsInData(swapData);
    return {
      amountIn: amountIn || foundAmounts.amountIn,
      amountOut: amountOut || foundAmounts.amountOut,
    };
  }

  return { amountIn, amountOut };
}

// Helper: Scan event data for amount-like fields
// Looks for numeric fields that could be swap amounts
function findAmountsInData(data: any): {
  amountIn?: string;
  amountOut?: string;
} {
  if (!data || typeof data !== "object") return {};

  const inCandidates: Array<{ key: string; value: string }> = [];
  const outCandidates: Array<{ key: string; value: string }> = [];

  // Scan all fields for amount-like values
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    // Skip non-amount fields
    if (
      lowerKey.includes("address") ||
      lowerKey.includes("sender") ||
      lowerKey.includes("pair") ||
      lowerKey.includes("to") ||
      lowerKey.includes("reserve")
    ) {
      continue;
    }

    // Look for numeric string values (amounts are usually strings in events)
    if (
      typeof value === "string" &&
      /^\d+$/.test(value) &&
      value !== "0"
    ) {
      if (lowerKey.includes("in")) {
        inCandidates.push({ key, value });
      } else if (lowerKey.includes("out")) {
        outCandidates.push({ key, value });
      }
    }
  }

  // Return the first valid candidates found
  return {
    amountIn: inCandidates[0]?.value,
    amountOut: outCandidates[0]?.value,
  };
}

// Parse transaction into human-readable actions
export function parseTransactionActions(
  tx: Types.Transaction
): ParsedAction[] {
  const actions: ParsedAction[] = [];

  if (!("payload" in tx)) {
    return actions;
  }

  const payload = tx.payload as Types.TransactionPayload_EntryFunctionPayload;
  if (!payload.function) {
    return actions;
  }

  const func = payload.function;
  const args = payload.arguments || [];
  const typeArgs = payload.type_arguments || [];
  const events: Types.Event[] = "events" in tx ? tx.events : [];
  const changes: Types.WriteSetChange[] = "changes" in tx ? tx.changes : [];
  const sender = "sender" in tx ? tx.sender : null;

  // Coin Transfer
  if (
    func === "0x1::coin::transfer" ||
    func === "0x1::aptos_account::transfer" ||
    func === "0x1::aptos_account::transfer_coins"
  ) {
    const to = args[0] as string;
    const amount = args[1] as string;

    // Determine token symbol
    let symbol = "MOVE"; // Default to MOVE
    if (func === "0x1::aptos_account::transfer") {
      // This function always transfers MOVE (AptosCoin)
      symbol = "MOVE";
    } else if (typeArgs[0]) {
      // For transfer_coins and coin::transfer, check type_arguments
      symbol = typeArgs[0].includes("AptosCoin") ? "MOVE" : getTokenSymbol(typeArgs[0]);
    }

    actions.push({
      type: "transfer",
      description: `Transfer ${formatMoveAmount(amount)} ${symbol}`,
      details: {
        from: sender || undefined,
        to,
        amount: formatMoveAmount(amount),
        symbol,
      },
    });
    return actions;
  }

  // Fungible Asset Transfer
  if (func === "0x1::primary_fungible_store::transfer") {
    const to = args[1] as string;
    const amount = args[2] as string;
    actions.push({
      type: "transfer",
      description: `Transfer ${formatMoveAmount(amount)} tokens`,
      details: {
        from: sender || undefined,
        to,
        amount: formatMoveAmount(amount),
        symbol: "FA",
      },
    });
    return actions;
  }

  // Object Transfer
  if (func === "0x1::object::transfer") {
    const object = args[0] as string;
    const to = args[1] as string;
    actions.push({
      type: "object_transfer",
      description: "Transfer Object",
      details: {
        from: sender || undefined,
        to,
        object,
      },
    });
    return actions;
  }

  // Staking
  if (
    func === "0x1::delegation_pool::add_stake" ||
    func === "0x1::delegation_pool::reactivate_stake" ||
    func.includes("::stake::add_stake")
  ) {
    const amount = args[1] as string;
    actions.push({
      type: "stake",
      description: `Stake ${formatMoveAmount(amount)} MOVE`,
      details: {
        amount: formatMoveAmount(amount),
        symbol: "MOVE",
      },
    });
    return actions;
  }

  // Unstaking
  if (
    func === "0x1::delegation_pool::unlock" ||
    func === "0x1::delegation_pool::withdraw" ||
    func.includes("::stake::unlock") ||
    func.includes("::stake::withdraw")
  ) {
    const amount = args[1] as string;
    actions.push({
      type: "unstake",
      description: `Unstake ${formatMoveAmount(amount)} MOVE`,
      details: {
        amount: formatMoveAmount(amount),
        symbol: "MOVE",
      },
    });
    return actions;
  }

  // Check for swap events from DEXs
  const swapEvents = events.filter(
    (e) =>
      e.type.includes("::swap::") ||
      e.type.includes("SwapEvent") ||
      e.type.includes("::pool::Swap")
  );
  if (swapEvents.length > 0) {
    const firstSwap = swapEvents[0];
    const lastSwap = swapEvents[swapEvents.length - 1];
    const dex = extractDexName(firstSwap.type);
    const dexEventType = firstSwap.type; // Store original event type for dynamic lookup

    // For multi-hop swaps, get input from first swap and output from last swap
    const firstAmounts = extractSwapAmounts(firstSwap.data);
    const lastAmounts = extractSwapAmounts(lastSwap.data);

    // Use intelligent extraction - handles various DEX field naming patterns
    const amountIn = firstAmounts.amountIn;
    const amountOut = lastAmounts.amountOut;

    // Try to extract metadata addresses from FA Withdraw/Deposit events
    const faWithdrawEvents = events.filter(
      (e) => e.type === "0x1::fungible_asset::Withdraw"
    );
    const faDepositEvents = events.filter(
      (e) => e.type === "0x1::fungible_asset::Deposit"
    );

    // Get metadata for input token (first withdraw)
    let metadataIn: string | undefined;
    let fallbackAmountIn: string | undefined;
    if (faWithdrawEvents.length > 0) {
      const firstWithdraw = faWithdrawEvents[0];
      const storeIn = firstWithdraw.data?.store;
      if (storeIn) {
        metadataIn = extractMetadataFromStore(storeIn, changes);
      }
      // Fallback: if SwapEvent didn't provide amountIn, use FA event amount
      if (!amountIn && firstWithdraw.data?.amount) {
        fallbackAmountIn = String(firstWithdraw.data.amount);
      }
    }

    // Get metadata for output token (last deposit)
    let metadataOut: string | undefined;
    let fallbackAmountOut: string | undefined;
    if (faDepositEvents.length > 0) {
      const lastDeposit = faDepositEvents[faDepositEvents.length - 1];
      const storeOut = lastDeposit.data?.store;
      if (storeOut) {
        metadataOut = extractMetadataFromStore(storeOut, changes);
      }
      // Fallback: if SwapEvent didn't provide amountOut, use FA event amount
      if (!amountOut && lastDeposit.data?.amount) {
        fallbackAmountOut = String(lastDeposit.data.amount);
      }
    }

    // Final amounts with fallback support
    const finalAmountIn = amountIn || fallbackAmountIn;
    const finalAmountOut = amountOut || fallbackAmountOut;

    // Format description based on number of swaps
    const isMultiHop = swapEvents.length > 1;
    const description = isMultiHop ? "Multi-hop Swap" : "Swap";

    actions.push({
      type: "swap",
      description,
      details: {
        dex,
        dexEventType,
        amountIn: finalAmountIn ? String(finalAmountIn) : undefined,
        amountOut: finalAmountOut ? String(finalAmountOut) : undefined,
        metadataIn,
        metadataOut,
        isMultiHop,
      },
    });
    return actions;
  }

  // NFT Mint
  const mintEvents = events.filter(
    (e) =>
      e.type.includes("::collection::Mint") ||
      e.type.includes("::collection::MintEvent") ||
      e.type.includes("::token::MintToken")
  );
  if (mintEvents.length > 0) {
    const mintEvent = mintEvents[0];
    actions.push({
      type: "nft_mint",
      description: "Mint NFT",
      details: {
        collection: mintEvent.data?.collection,
        token: mintEvent.data?.token,
      },
    });
    return actions;
  }

  // NFT Burn
  const burnEvents = events.filter(
    (e) =>
      e.type.includes("::collection::Burn") ||
      e.type.includes("::collection::BurnEvent")
  );
  if (burnEvents.length > 0) {
    const burnEvent = burnEvents[0];
    actions.push({
      type: "nft_burn",
      description: "Burn NFT",
      details: {
        collection: burnEvent.data?.collection,
        token: burnEvent.data?.token,
      },
    });
    return actions;
  }

  // Default: Contract Call
  const funcParts = func.split("::");
  const moduleName = funcParts.length >= 2 ? funcParts[1] : "unknown";
  const funcName = funcParts.length >= 3 ? funcParts[2] : func;
  const contractAddr = funcParts[0];

  actions.push({
    type: "contract_call",
    description: `Call ${moduleName}::${funcName}`,
    details: {
      contract: contractAddr,
      function: `${moduleName}::${funcName}`,
    },
  });

  return actions;
}

function getTokenSymbol(typeArg?: string): string {
  if (!typeArg) return "Token";
  if (typeArg.includes("AptosCoin")) return "MOVE";
  const parts = typeArg.split("::");
  return parts[parts.length - 1] || "Token";
}

function extractDexName(eventType: string): string {
  if (eventType.includes("liquidswap")) return "LiquidSwap";
  if (eventType.includes("pancake")) return "PancakeSwap";
  if (eventType.includes("aux")) return "Aux Exchange";
  if (eventType.includes("pontem")) return "Pontem";
  if (eventType.includes("cetus")) return "Cetus";
  if (eventType.includes("thala")) return "Thala";
  if (eventType.includes("anime")) return "AnimeSwap";

  const parts = eventType.split("::");
  return parts[1] || "DEX";
}

interface TransactionActionCardProps {
  actions: ParsedAction[];
  className?: string;
}

export function TransactionActionCard({
  actions,
  className,
}: TransactionActionCardProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-4",
        className
      )}
    >
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Transaction Actions
      </div>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <ActionItem key={index} action={action} />
        ))}
      </div>
    </div>
  );
}

// Fallback icon when token icon is not available
function TokenIconFallback({ symbol }: { symbol: string }) {
  const text = symbol ? symbol.slice(0, 2).toUpperCase() : "";
  return (
    <div className="h-4 w-4 rounded-full bg-guild-green-500/20 flex items-center justify-center text-[10px] font-semibold text-guild-green-300 shrink-0">
      {text || <Coins className="h-2.5 w-2.5" />}
    </div>
  );
}

// Component to display formatted token amount with symbol and icon
function TokenAmount({
  amount,
  metadataAddress,
}: {
  amount: string;
  metadataAddress?: string;
}) {
  const { data: metadata } = useGetFaMetadata(metadataAddress || "");

  if (!amount) return null;

  // Format amount with decimals if metadata is available
  const formattedAmount = metadata
    ? formatMoveAmount(amount, metadata.decimals)
    : amount;

  const symbol = metadata?.symbol || "";

  // Get icon_uri from metadata, with fallback for MOVE token
  const isMoveToken = metadataAddress === "0xa" || metadataAddress === "0x000000000000000000000000000000000000000000000000000000000000000a";
  const iconUri = metadata?.icon_uri || (isMoveToken ? "/coinLogo.png" : undefined);

  // Determine if this is a Coin (contains ::) or FA (just address)
  // Same logic as BalanceChangeTable
  const isCoin = metadataAddress?.includes("::");
  const assetHref = metadataAddress
    ? isCoin
      ? `/coin/${formatMovementPath(metadataAddress)}`
      : `/fa/${metadataAddress}`
    : undefined;

  // Token name content (icon + symbol) - clickable and highlighted
  const TokenNameContent = (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-guild-green-300 hover:text-guild-green-300/80 transition-colors",
        assetHref && "cursor-pointer"
      )}
    >
      {/* Token Icon with fallback */}
      {iconUri ? (
        <img
          src={iconUri}
          alt={symbol}
          className="h-4 w-4 rounded-full object-cover shrink-0"
          onError={(e) => {
            // Replace with fallback on error
            const fallback = document.createElement("div");
            fallback.className =
              "h-4 w-4 rounded-full bg-guild-green-500/20 flex items-center justify-center text-[10px] font-semibold text-guild-green-300 shrink-0";
            fallback.textContent = symbol.slice(0, 2).toUpperCase();
            e.currentTarget.replaceWith(fallback);
          }}
        />
      ) : (
        <TokenIconFallback symbol={symbol} />
      )}
      <span>{symbol}</span>
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      {/* Amount - not highlighted */}
      <span className="text-foreground">{formattedAmount}</span>
      {/* Token name - highlighted and clickable if asset href exists */}
      {assetHref ? (
        <a
          href={assetHref}
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          {TokenNameContent}
        </a>
      ) : (
        TokenNameContent
      )}
    </span>
  );
}

// Component to display DEX name with dynamic package name
function DexBadge({
  eventType,
  fallbackName,
}: {
  eventType?: string;
  fallbackName?: string;
}) {
  const packageAddress = extractPackageAddress(eventType || "");
  const { data: packageName } = useGetPackageName(packageAddress);

  // Use package name from metadata, fallback to hardcoded name
  const displayName = packageName || fallbackName || "DEX";

  // Build link to modules tab if we have package address
  const modulesLink = packageAddress
    ? `/account/${packageAddress}/modules`
    : null;

  const nameContent = (
    <span
      className={cn(
        "inline-flex items-center text-sm font-medium transition-colors",
        modulesLink &&
          "text-guild-green-300 hover:text-guild-green-300/80 cursor-pointer"
      )}
    >
      {displayName}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      on
      {modulesLink ? (
        <a
          href={modulesLink}
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          {nameContent}
        </a>
      ) : (
        nameContent
      )}
    </span>
  );
}

function ActionItem({ action }: { action: ParsedAction }) {
  const Icon = ACTION_ICONS[action.type];

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg border shrink-0",
          ACTION_COLORS[action.type]
        )}
      >
        {Icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{action.description}</span>
          {action.type === "swap" && (
            <DexBadge
              eventType={action.details?.dexEventType}
              fallbackName={action.details?.dex}
            />
          )}
          {action.type === "contract_call" && action.details?.function && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-mono border border-border/50">
              {action.details.function}
            </span>
          )}
        </div>
        {action.details && (
          <div className="mt-1.5 text-sm text-muted-foreground space-y-1">
            {action.details.from && action.details.to && (
              <div className="flex items-center gap-2 flex-wrap">
                <CopyableAddress
                  address={action.details.from}
                  href={`/account/${action.details.from}`}
                  truncateLength={{ start: 6, end: 4 }}
                  showLabel
                />
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <CopyableAddress
                  address={action.details.to}
                  href={`/account/${action.details.to}`}
                  truncateLength={{ start: 6, end: 4 }}
                  showLabel
                />
              </div>
            )}
            {(action.details.amountIn || action.details.amountOut) && (
              <div className="flex items-center gap-2 flex-wrap">
                {action.details.amountIn && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-muted-foreground">In:</span>
                    <TokenAmount
                      amount={action.details.amountIn}
                      metadataAddress={action.details.metadataIn}
                    />
                  </span>
                )}
                {action.details.amountIn && action.details.amountOut && (
                  <ArrowRight className="h-3 w-3" />
                )}
                {action.details.amountOut && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-muted-foreground">Out:</span>
                    <TokenAmount
                      amount={action.details.amountOut}
                      metadataAddress={action.details.metadataOut}
                    />
                  </span>
                )}
              </div>
            )}
            {action.details.contract && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>Contract:</span>
                <CopyableAddress
                  address={action.details.contract}
                  href={`/account/${action.details.contract}`}
                  truncateLength={{ start: 6, end: 4 }}
                  showLabel
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

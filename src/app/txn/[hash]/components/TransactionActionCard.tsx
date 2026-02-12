"use client";

import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { formatMoveAmount } from "@/utils/transaction";
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
    dex?: string;
    collection?: string;
    token?: string;
    object?: string;
    contract?: string;
    function?: string;
  };
}

const ACTION_ICONS: Record<ParsedAction["type"], React.ReactNode> = {
  transfer: <Send className="h-4 w-4" />,
  swap: <ArrowLeftRight className="h-4 w-4" />,
  nft_mint: <Image className="h-4 w-4" />,
  nft_burn: <Flame className="h-4 w-4" />,
  object_transfer: <Package className="h-4 w-4" />,
  contract_call: <FileCode className="h-4 w-4" />,
  stake: <Coins className="h-4 w-4" />,
  unstake: <Coins className="h-4 w-4" />,
  claim: <Coins className="h-4 w-4" />,
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
  const sender = "sender" in tx ? tx.sender : null;

  // Coin Transfer
  if (
    func === "0x1::coin::transfer" ||
    func === "0x1::aptos_account::transfer" ||
    func === "0x1::aptos_account::transfer_coins"
  ) {
    const to = args[0] as string;
    const amount = args[1] as string;
    const symbol = typeArgs[0]?.includes("AptosCoin") ? "MOVE" : getTokenSymbol(typeArgs[0]);
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
  if (func.includes("::stake::") || func.includes("::delegation_pool::add_stake")) {
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
  if (func.includes("::stake::withdraw") || func.includes("::delegation_pool::unlock")) {
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
    const swapEvent = swapEvents[0];
    const dex = extractDexName(swapEvent.type);
    actions.push({
      type: "swap",
      description: `Swap on ${dex}`,
      details: {
        dex,
        amountIn: swapEvent.data?.amount_in || swapEvent.data?.amount_x_in,
        amountOut: swapEvent.data?.amount_out || swapEvent.data?.amount_y_out,
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

function ActionItem({ action }: { action: ParsedAction }) {
  const Icon = ACTION_ICONS[action.type];

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg border",
          ACTION_COLORS[action.type]
        )}
      >
        {Icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{action.description}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {action.type.replace(/_/g, " ")}
          </Badge>
        </div>
        {action.details && (
          <div className="mt-1.5 text-xs text-muted-foreground space-y-1">
            {action.details.from && action.details.to && (
              <div className="flex items-center gap-2 flex-wrap">
                <CopyableAddress
                  address={action.details.from}
                  href={`/account/${action.details.from}`}
                  truncateLength={{ start: 6, end: 4 }}
                />
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <CopyableAddress
                  address={action.details.to}
                  href={`/account/${action.details.to}`}
                  truncateLength={{ start: 6, end: 4 }}
                />
              </div>
            )}
            {action.details.dex && (
              <div>
                Protocol: <span className="text-foreground">{action.details.dex}</span>
              </div>
            )}
            {action.details.contract && (
              <div className="flex items-center gap-1">
                Contract:{" "}
                <CopyableAddress
                  address={action.details.contract}
                  href={`/account/${action.details.contract}`}
                  truncateLength={{ start: 6, end: 4 }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  Rocket,
  Vote,
  UserPlus,
  ScrollText,
} from "lucide-react";
import { cn } from "@/utils/styling";
import type { Types } from "aptos";
import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import {
  useGetPackageName,
  extractPackageAddress,
} from "@/hooks/accounts/useGetPackageName";
import { useGetTokenData } from "@/hooks/tokens/useGetTokenData";
import { useGetAccountLabel } from "@/hooks/accounts/useGetAccountLabel";

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
    | "claim"
    | "deploy"
    | "governance"
    | "account_creation"
    | "register"
    | "coin_mint"
    | "coin_burn";
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
    metadata?: string;       // FA metadata address (for primary_fungible_store::transfer)
    proposalId?: string;     // For governance vote actions
    recipientCount?: number; // For batch transfers
    moduleName?: string;     // For deploy actions (extracted from write_module changes)
  };
}

export const ACTION_ICONS: Record<ParsedAction["type"], React.ReactNode> = {
  transfer: <Send className="h-5 w-5" />,
  swap: <ArrowLeftRight className="h-5 w-5" />,
  nft_mint: <Image className="h-5 w-5" />,
  nft_burn: <Flame className="h-5 w-5" />,
  object_transfer: <Package className="h-5 w-5" />,
  contract_call: <FileCode className="h-5 w-5" />,
  stake: <Coins className="h-5 w-5" />,
  unstake: <Coins className="h-5 w-5" />,
  claim: <Coins className="h-5 w-5" />,
  deploy: <Rocket className="h-5 w-5" />,
  governance: <Vote className="h-5 w-5" />,
  account_creation: <UserPlus className="h-5 w-5" />,
  register: <ScrollText className="h-5 w-5" />,
  coin_mint: <Coins className="h-5 w-5" />,
  coin_burn: <Flame className="h-5 w-5" />,
};

export const ACTION_COLORS: Record<ParsedAction["type"], string> = {
  transfer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  swap: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  nft_mint: "bg-green-500/10 text-green-500 border-green-500/20",
  nft_burn: "bg-red-500/10 text-red-500 border-red-500/20",
  object_transfer: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  contract_call: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  stake: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  unstake: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  claim: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  deploy: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  governance: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  account_creation: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  register: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  coin_mint: "bg-lime-500/10 text-lime-500 border-lime-500/20",
  coin_burn: "bg-rose-500/10 text-rose-500 border-rose-500/20",
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

  // ── Module Deployment ──
  if (
    func === "0x1::code::publish_package_txn" ||
    func === "0x1::resource_account::create_resource_account_and_publish_package"
  ) {
    const isResourceAccount = func.includes("resource_account");
    // Extract deployed module name from write_module changes
    let moduleName: string | undefined;
    for (const change of changes) {
      if (change.type === "write_module" && "module" in change) {
        const moduleId = String((change as { module: string }).module);
        // moduleId format: "0xABC::ModuleName" — extract just the name part
        const parts = moduleId.split("::");
        moduleName = parts.length >= 2 ? parts[1] : moduleId;
        break;
      }
    }
    const baseDesc = isResourceAccount ? "Deploy (Resource Account)" : "Deploy";
    actions.push({
      type: "deploy",
      description: moduleName ? `${baseDesc} ${moduleName}` : `${baseDesc} Module`,
      details: {
        contract: sender || undefined,
        function: func.split("::").slice(1).join("::"),
        moduleName,
      },
    });
    return actions;
  }

  // ── Account Creation ──
  if (
    func === "0x1::aptos_account::create_account" ||
    func === "0x1::resource_account::create_resource_account" ||
    func === "0x1::multisig_account::create_with_owners"
  ) {
    let description = "Create Account";
    if (func.includes("resource_account")) description = "Create Resource Account";
    if (func.includes("multisig_account")) description = "Create Multisig Account";

    const newAccount = args[0] as string | undefined;
    actions.push({
      type: "account_creation",
      description,
      details: {
        from: sender || undefined,
        to: newAccount,
      },
    });
    return actions;
  }

  // ── Auth Key Rotation (enhanced contract_call) ──
  if (
    func === "0x1::account::rotate_authentication_key" ||
    func === "0x1::account::offer_rotation_capability"
  ) {
    const isRotate = func.includes("rotate_authentication_key");
    actions.push({
      type: "contract_call",
      description: isRotate ? "Rotate Auth Key" : "Offer Rotation Capability",
      details: {
        contract: "0x1",
        function: func.split("::").slice(1).join("::"),
      },
    });
    return actions;
  }

  // ── Coin Registration ──
  if (
    func === "0x1::coin::register" ||
    func === "0x1::managed_coin::register"
  ) {
    const coinType = typeArgs[0];
    const symbol = coinType ? getTokenSymbol(coinType) : "Token";
    actions.push({
      type: "register",
      description: `Register ${symbol}`,
      details: {
        symbol,
        contract: "0x1",
        function: func.split("::").slice(1).join("::"),
      },
    });
    return actions;
  }

  // ── Managed Coin Mint ──
  if (func === "0x1::managed_coin::mint") {
    const to = args[0] as string;
    const amount = args[1] as string;
    const coinType = typeArgs[0];
    const symbol = coinType ? getTokenSymbol(coinType) : "Token";
    actions.push({
      type: "coin_mint",
      description: `Mint ${formatMoveAmount(amount)} ${symbol}`,
      details: {
        to,
        amount: formatMoveAmount(amount),
        symbol,
      },
    });
    return actions;
  }

  // ── Managed Coin Burn ──
  if (func === "0x1::managed_coin::burn") {
    const amount = args[0] as string;
    const coinType = typeArgs[0];
    const symbol = coinType ? getTokenSymbol(coinType) : "Token";
    actions.push({
      type: "coin_burn",
      description: `Burn ${formatMoveAmount(amount)} ${symbol}`,
      details: {
        amount: formatMoveAmount(amount),
        symbol,
      },
    });
    return actions;
  }

  // ── Governance ──
  if (
    func === "0x1::aptos_governance::create_proposal" ||
    func === "0x1::aptos_governance::vote" ||
    func === "0x1::delegation_pool::create_proposal" ||
    func === "0x1::delegation_pool::vote"
  ) {
    const isVote = func.endsWith("::vote");
    const isPool = func.includes("delegation_pool");
    let description: string;
    if (isVote) {
      description = isPool ? "Vote on Pool Proposal" : "Vote on Governance Proposal";
    } else {
      description = isPool ? "Create Pool Proposal" : "Create Governance Proposal";
    }
    const proposalId = isVote ? (args[1] as string) : undefined;
    actions.push({
      type: "governance",
      description,
      details: {
        contract: "0x1",
        function: func.split("::").slice(1).join("::"),
        proposalId,
      },
    });
    return actions;
  }

  // ── Batch Transfers ──
  if (
    func === "0x1::aptos_account::batch_transfer" ||
    func === "0x1::aptos_account::batch_transfer_coins"
  ) {
    const recipients = args[0];
    const recipientCount = Array.isArray(recipients) ? recipients.length : 0;
    const isMoveTransfer = func === "0x1::aptos_account::batch_transfer";
    const symbol = isMoveTransfer
      ? "MOVE"
      : typeArgs[0]
        ? getTokenSymbol(typeArgs[0])
        : "tokens";
    actions.push({
      type: "transfer",
      description: `Batch Transfer ${symbol}${recipientCount > 0 ? ` to ${recipientCount} recipients` : ""}`,
      details: {
        from: sender || undefined,
        symbol,
        recipientCount,
      },
    });
    return actions;
  }

  // ── Coin Transfer ──
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

  // ── Fungible Asset Transfer (fixed: use metadata for real token info) ──
  if (
    func === "0x1::primary_fungible_store::transfer" ||
    func === "0x1::aptos_account::fungible_transfer_only"
  ) {
    const metadataAddr = args[0] as string;
    const to = args[1] as string;
    const amount = args[2] as string;
    actions.push({
      type: "transfer",
      description: "Transfer tokens",
      details: {
        from: sender || undefined,
        to,
        amount,        // Raw amount — TokenAmount component formats with metadata decimals
        metadata: metadataAddr,
        symbol: "FA",  // Fallback only; UI resolves real symbol from metadata
      },
    });
    return actions;
  }

  // ── Object Transfer ──
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

  // ── Staking (exact matches only) ──
  if (
    func === "0x1::delegation_pool::add_stake" ||
    func === "0x1::delegation_pool::reactivate_stake"
  ) {
    const poolAddress = args[0] as string;
    const amount = args[1] as string;
    actions.push({
      type: "stake",
      description: `Stake ${formatMoveAmount(amount)} MOVE`,
      details: {
        amount: formatMoveAmount(amount),
        symbol: "MOVE",
        contract: poolAddress,
      },
    });
    return actions;
  }

  // ── Claim Staking Rewards (withdraw with amount=0) ──
  if (func === "0x1::delegation_pool::withdraw") {
    const poolAddress = args[0] as string;
    const amount = args[1] as string;
    if (amount === "0") {
      actions.push({
        type: "claim",
        description: "Claim Staking Rewards",
        details: {
          symbol: "MOVE",
          contract: poolAddress,
        },
      });
      return actions;
    }
    // Non-zero withdraw is unstake
    actions.push({
      type: "unstake",
      description: `Unstake ${formatMoveAmount(amount)} MOVE`,
      details: {
        amount: formatMoveAmount(amount),
        symbol: "MOVE",
        contract: poolAddress,
      },
    });
    return actions;
  }

  // ── Unstaking (exact matches only) ──
  if (func === "0x1::delegation_pool::unlock") {
    const poolAddress = args[0] as string;
    const amount = args[1] as string;
    actions.push({
      type: "unstake",
      description: `Unstake ${formatMoveAmount(amount)} MOVE`,
      details: {
        amount: formatMoveAmount(amount),
        symbol: "MOVE",
        contract: poolAddress,
      },
    });
    return actions;
  }

  // ═══════════════════════════════════════════════════
  // 0x4:: Digital Assets (Token V2 Standard)
  // ═══════════════════════════════════════════════════

  // ── V2 NFT Mint (function-level, before event detection) ──
  if (
    func === "0x4::aptos_token::mint" ||
    func === "0x4::aptos_token::mint_soul_bound"
  ) {
    const isSoulBound = func.includes("soul_bound");
    // mint(collection, description, name, uri, ..., to)
    // mint_soul_bound(collection, description, name, property_keys, property_types, property_values, uri, soul_bound_to)
    const to = isSoulBound ? (args[7] as string) : undefined;
    const tokenName = args[2] as string | undefined;
    // Try to find minted token address from changes
    let tokenAddr: string | undefined;
    for (const change of changes) {
      if (change.type === "write_resource" && "address" in change) {
        const cd = change as { data?: { type?: string } };
        if (cd.data?.type === "0x4::token::Token") {
          tokenAddr = (change as { address?: string }).address;
          break;
        }
      }
    }
    actions.push({
      type: "nft_mint",
      description: isSoulBound ? "Mint Soul Bound NFT" : "Mint NFT",
      details: {
        token: tokenAddr || tokenName,
        from: sender || undefined,
        to,
      },
    });
    return actions;
  }

  // ── V2 NFT Burn ──
  if (func === "0x4::aptos_token::burn") {
    const tokenObj = args[0] as string;
    actions.push({
      type: "nft_burn",
      description: "Burn NFT",
      details: {
        token: tokenObj,
        from: sender || undefined,
      },
    });
    return actions;
  }

  // ── V2 NFT Management (enhanced contract_call) ──
  if (
    func === "0x4::aptos_token::freeze_transfer" ||
    func === "0x4::aptos_token::unfreeze_transfer" ||
    func === "0x4::aptos_token::set_description" ||
    func === "0x4::aptos_token::set_uri"
  ) {
    const funcName = func.split("::")[2];
    const descriptions: Record<string, string> = {
      freeze_transfer: "Freeze NFT Transfer",
      unfreeze_transfer: "Unfreeze NFT Transfer",
      set_description: "Update NFT Description",
      set_uri: "Update NFT URI",
    };
    actions.push({
      type: "contract_call",
      description: descriptions[funcName] || `Call ${funcName}`,
      details: {
        contract: "0x4",
        function: `aptos_token::${funcName}`,
        token: args[0] as string,
      },
    });
    return actions;
  }

  // ═══════════════════════════════════════════════════
  // 0x3:: Legacy Token V1 Standard
  // ═══════════════════════════════════════════════════

  // ── V1 Token Create / Mint ──
  if (
    func === "0x3::token::create_token_script" ||
    func === "0x3::token::mint_script"
  ) {
    const isCreate = func.includes("create_token_script");
    // create_token_script: (collection, name, description, supply, max, uri, ...)
    // mint_script: (creator, collection, name, amount)
    const tokenName = isCreate ? (args[1] as string) : (args[2] as string);
    const collection = isCreate ? (args[0] as string) : (args[1] as string);
    actions.push({
      type: "nft_mint",
      description: isCreate ? "Create Token (V1)" : "Mint Token (V1)",
      details: {
        collection,
        token: tokenName,
        from: sender || undefined,
      },
    });
    return actions;
  }

  // ── V1 Token Transfer Offer ──
  if (func === "0x3::token_transfers::offer_script") {
    // offer_script(receiver, creator, collection, name, property_version, amount)
    const to = args[0] as string;
    const tokenName = args[3] as string;
    actions.push({
      type: "object_transfer",
      description: "Offer Token (V1)",
      details: {
        from: sender || undefined,
        to,
        token: tokenName,
      },
    });
    return actions;
  }

  // ── V1 Token Transfer Claim ──
  if (func === "0x3::token_transfers::claim_script") {
    // claim_script(sender, creator, collection, name, property_version)
    const from = args[0] as string;
    const tokenName = args[3] as string;
    actions.push({
      type: "claim",
      description: "Claim Token (V1)",
      details: {
        from,
        to: sender || undefined,
        token: tokenName,
      },
    });
    return actions;
  }

  // ── V1 Token Transfer Cancel ──
  if (func === "0x3::token_transfers::cancel_offer_script") {
    // cancel_offer_script(receiver, creator, collection, name, property_version)
    const to = args[0] as string;
    actions.push({
      type: "contract_call",
      description: "Cancel Token Offer (V1)",
      details: {
        contract: "0x3",
        function: "token_transfers::cancel_offer_script",
        to,
      },
    });
    return actions;
  }

  // ═══════════════════════════════════════════════════
  // Event-based detection (swap, NFT events, etc.)
  // ═══════════════════════════════════════════════════

  // ── Check for swap events from DEXs ──
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
    // Token address from event data, or fallback to changes
    let tokenAddr = mintEvent.data?.token;
    const collectionAddr = mintEvent.data?.collection;
    // If token address not in event, try to find newly created 0x4::token::Token in changes
    if (!tokenAddr) {
      for (const change of changes) {
        if (
          change.type === "write_resource" &&
          "address" in change
        ) {
          const cd = change as { data?: { type?: string } };
          if (cd.data?.type === "0x4::token::Token") {
            tokenAddr = (change as { address?: string }).address;
            break;
          }
        }
      }
    }
    actions.push({
      type: "nft_mint",
      description: "Mint NFT",
      details: {
        collection: collectionAddr,
        token: tokenAddr,
        from: sender || undefined,
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
        from: sender || undefined,
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
    description: "Call",
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
    <div className="h-4 w-4 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0">
      {text || <Coins className="h-2.5 w-2.5" />}
    </div>
  );
}

// Component to display formatted token amount with symbol and icon
export function TokenAmount({
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
        "inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors",
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
              "h-4 w-4 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0";
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

// Component to display FA transfer description with resolved token name and amount
export function FaTransferDescription({
  amount,
  metadataAddress,
}: {
  amount: string;
  metadataAddress: string;
}) {
  const { data: metadata } = useGetFaMetadata(metadataAddress);

  const formattedAmount = metadata
    ? formatMoveAmount(amount, metadata.decimals)
    : amount;
  const symbol = metadata?.symbol || "tokens";

  const isMoveToken =
    metadataAddress === "0xa" ||
    metadataAddress ===
      "0x000000000000000000000000000000000000000000000000000000000000000a";
  const iconUri =
    metadata?.icon_uri || (isMoveToken ? "/coinLogo.png" : undefined);

  const isCoin = metadataAddress.includes("::");
  const assetHref = isCoin
    ? `/coin/${formatMovementPath(metadataAddress)}`
    : `/fa/${metadataAddress}`;

  const tokenBadge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium",
        assetHref && "cursor-pointer"
      )}
    >
      {iconUri ? (
        <img
          src={iconUri}
          alt={symbol}
          className="h-4 w-4 rounded-full object-cover shrink-0"
          onError={(e) => {
            const fallback = document.createElement("div");
            fallback.className =
              "h-4 w-4 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0";
            fallback.textContent = symbol.slice(0, 2).toUpperCase();
            e.currentTarget.replaceWith(fallback);
          }}
        />
      ) : (
        <TokenIconFallback symbol={symbol} />
      )}
      {symbol}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-sm">
      <span>Transfer</span>
      <span className="font-mono">{formattedAmount}</span>
      {assetHref ? (
        <a
          href={assetHref}
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          {tokenBadge}
        </a>
      ) : (
        tokenBadge
      )}
    </span>
  );
}

// Component to display DEX name with dynamic package name
export function DexBadge({
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
          "text-primary hover:text-primary/80 cursor-pointer"
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

// Component to display staking pool with link to validator page
export function StakingPoolBadge({ poolAddress }: { poolAddress: string }) {
  const label = useGetAccountLabel(poolAddress);
  const displayName =
    label?.name || `${poolAddress.slice(0, 6)}...${poolAddress.slice(-4)}`;
  const validatorLink = `/validator/${poolAddress}`;

  const nameContent = (
    <span
      className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
    >
      {displayName}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      on
      <a
        href={validatorLink}
        className="inline-flex"
        onClick={(e) => e.stopPropagation()}
      >
        {nameContent}
      </a>
    </span>
  );
}

// Component to display contract/package name badge with link to modules page
export function ContractBadge({ contractAddress }: { contractAddress: string }) {
  const { data: packageName } = useGetPackageName(contractAddress);
  const displayName =
    packageName ||
    `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;
  const modulesLink = `/account/${contractAddress}/modules`;

  const nameContent = (
    <span className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">
      {displayName}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      on
      <a
        href={modulesLink}
        className="inline-flex"
        onClick={(e) => e.stopPropagation()}
      >
        {nameContent}
      </a>
    </span>
  );
}

// Component to display NFT token name and collection name with clickable links
function NftActionDetail({
  tokenAddress,
  collectionAddress,
}: {
  tokenAddress?: string;
  collectionAddress?: string;
}) {
  // Only query if tokenAddress looks like a hex address (not a plain name from V1)
  const isTokenAddr =
    tokenAddress?.startsWith("0x") && tokenAddress.length > 10;
  const { data: tokenDatas, isLoading } = useGetTokenData(
    isTokenAddr ? tokenAddress : undefined
  );
  const token = tokenDatas?.[0];

  // Resolved names (from query or fallback)
  const tokenName = token?.token_name;
  const collectionName = token?.current_collection?.collection_name;
  const resolvedCollectionAddr =
    token?.current_collection?.collection_id || collectionAddress;

  // If still loading, show minimal placeholder
  if (isLoading && isTokenAddr) {
    return (
      <span className="text-muted-foreground text-xs animate-pulse">
        Loading...
      </span>
    );
  }

  // Build inline description parts
  const hasTokenName = tokenName || (!isTokenAddr && tokenAddress);
  const hasCollection = collectionName || resolvedCollectionAddr;

  if (!hasTokenName && !hasCollection) return null;

  const tokenDisplayName = tokenName || tokenAddress;
  const tokenHref = isTokenAddr ? `/token/${tokenAddress}` : undefined;

  const collectionDisplayName = collectionName;
  const collectionHref = resolvedCollectionAddr
    ? `/object/${resolvedCollectionAddr}`
    : undefined;

  return (
    <span className="inline-flex items-center gap-1 flex-wrap text-sm">
      {tokenDisplayName && (
        <>
          {tokenHref ? (
            <a
              href={tokenHref}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {tokenDisplayName}
            </a>
          ) : (
            <span className="font-medium text-foreground">
              {tokenDisplayName}
            </span>
          )}
        </>
      )}
      {hasCollection && tokenDisplayName && (
        <span className="text-muted-foreground">from</span>
      )}
      {hasCollection && (
        <>
          {collectionHref ? (
            <a
              href={collectionHref}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {collectionDisplayName ||
                `${resolvedCollectionAddr!.slice(0, 6)}...${resolvedCollectionAddr!.slice(-4)}`}
            </a>
          ) : (
            <span className="font-medium text-foreground">
              {collectionDisplayName}
            </span>
          )}
        </>
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
          {action.type === "transfer" && action.details?.metadata && action.details?.amount ? (
            <FaTransferDescription
              amount={action.details.amount}
              metadataAddress={action.details.metadata}
            />
          ) : (
            <span className="font-medium text-sm">{action.description}</span>
          )}
          {action.type === "swap" && (
            <DexBadge
              eventType={action.details?.dexEventType}
              fallbackName={action.details?.dex}
            />
          )}
          {action.type === "contract_call" && action.details?.function && (
            action.details.contract ? (
              <a
                href={`/account/${action.details.contract}/modules/code/${action.details.function.split("::")[0]}`}
                className="text-sm font-mono font-medium text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {action.details.function}
              </a>
            ) : (
              <span className="text-sm font-mono font-medium">{action.details.function}</span>
            )
          )}
          {action.type === "register" && action.details?.function && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-mono border border-border/50">
              {action.details.function}
            </span>
          )}
          {action.type === "governance" && action.details?.proposalId && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-500 text-xs font-mono border border-violet-500/20">
              Proposal #{action.details.proposalId}
            </span>
          )}
          {(action.type === "stake" || action.type === "unstake" || action.type === "claim") &&
            action.details?.contract && (
            <StakingPoolBadge poolAddress={action.details.contract} />
          )}
          {action.type === "contract_call" && action.details?.contract && (
            <ContractBadge contractAddress={action.details.contract} />
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
            {/* FA transfer amount is now shown in description via FaTransferDescription */}
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
            {/* NFT token and collection with resolved names */}
            {(action.type === "nft_mint" || action.type === "nft_burn") &&
              (action.details.token || action.details.collection) && (
              <NftActionDetail
                tokenAddress={action.details.token}
                collectionAddress={action.details.collection}
              />
            )}
            {/* Object transfer: link to object page */}
            {action.type === "object_transfer" && action.details.object && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>Object:</span>
                <CopyableAddress
                  address={action.details.object}
                  href={`/object/${action.details.object}`}
                  truncateLength={{ start: 6, end: 4 }}
                  showLabel
                />
              </div>
            )}
            {/* Coin mint: show recipient */}
            {action.type === "coin_mint" && action.details.to && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>To:</span>
                <CopyableAddress
                  address={action.details.to}
                  href={`/account/${action.details.to}`}
                  truncateLength={{ start: 6, end: 4 }}
                  showLabel
                />
              </div>
            )}
            {/* Show Contract address line only for types without inline badges */}
            {action.details.contract &&
              action.type !== "contract_call" &&
              action.type !== "stake" &&
              action.type !== "unstake" &&
              action.type !== "claim" &&
              action.type !== "register" &&
              action.type !== "governance" && (
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

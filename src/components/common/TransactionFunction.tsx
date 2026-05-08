"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Types } from "aptos";
import { ArrowRight, FileCheck } from "lucide-react";
import { cn } from "@/utils/styling";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useContractSourceAvailability } from "@/hooks/accounts/useContractSourceAvailability";
import { useGetFunctionParams } from "@/hooks/accounts/useGetFunctionParams";
import { formatMovementPath } from "@/utils";
import { getFunctionDescription } from "@/constants/contractFunctions";
import {
  parseTransactionActions,
  TokenAmount,
  DexBadge,
  StakingPoolBadge,
  ContractBadge,
  FaTransferDescription,
} from "@/app/txn/[hash]/components";
import type { ParsedAction } from "@/app/txn/[hash]/components";

interface TransactionFunctionProps {
  transaction?: Types.Transaction;
  entryFunctionIdStr?: string;
  className?: string;
}

export function TransactionFunction({
  transaction,
  entryFunctionIdStr,
  className,
}: TransactionFunctionProps) {
  // If only entryFunctionIdStr is provided (no full transaction object)
  if (!transaction && entryFunctionIdStr) {
    const parts = entryFunctionIdStr.split("::");
    if (parts.length < 3) {
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-md bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-all duration-200 text-sm",
            className,
          )}
        >
          {entryFunctionIdStr}
        </span>
      );
    }
    const [address, moduleName, functionName] = parts;
    return (
      <TransactionFunctionWithSource
        address={address}
        moduleName={moduleName}
        functionName={functionName}
        functionFullStr={entryFunctionIdStr}
        args={[]}
        typeArgs={[]}
        className={className}
      />
    );
  }

  if (!transaction || !("payload" in transaction)) {
    return "-";
  }

  if (transaction.payload.type === "script_payload") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-all duration-200 text-sm",
          className,
        )}
      >
        Script
      </span>
    );
  }

  let functionFullStr: string;
  if (transaction.payload.type === "multisig_payload") {
    if (
      "transaction_payload" in transaction.payload &&
      transaction.payload.transaction_payload &&
      "function" in transaction.payload.transaction_payload
    ) {
      functionFullStr = transaction.payload.transaction_payload.function;
    } else {
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-md bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-all duration-200 text-sm",
            className,
          )}
        >
          Multisig
        </span>
      );
    }
  } else if ("function" in transaction.payload) {
    functionFullStr = transaction.payload.function;
  } else {
    return "-";
  }

  // Handle Coin Transfer special cases or just treat as normal function
  // The source implementation checks for coin transfer and renders "Coin Transfer"
  // but links to the actual function. I will replicate that behavior if desired,
  // or simply link to the function.
  // For now, I'll stick to linking to the function as it's more generic and
  // consistent with providing direct code access.

  // Extract address, module, and function name
  // Format: address::module::function
  const parts = functionFullStr.split("::");
  if (parts.length < 3) {
    // Fallback for unexpected formats
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-all duration-200 text-sm",
          className,
        )}
      >
        {functionFullStr}
      </span>
    );
  }

  const [address, moduleName, functionName] = parts;

  // Extract actual arguments and type_arguments from the payload
  const entryPayload = getEntryPayload(transaction.payload);

  return (
    <TransactionFunctionWithSource
      transaction={transaction}
      address={address}
      moduleName={moduleName}
      functionName={functionName}
      functionFullStr={functionFullStr}
      args={entryPayload?.arguments ?? []}
      typeArgs={entryPayload?.type_arguments ?? []}
      className={className}
    />
  );
}

/**
 * Extract the entry function payload from various payload types.
 */
function getEntryPayload(
  payload: Types.TransactionPayload,
): Types.TransactionPayload_EntryFunctionPayload | null {
  if (payload.type === "entry_function_payload") {
    return payload as Types.TransactionPayload_EntryFunctionPayload;
  }
  if (
    payload.type === "multisig_payload" &&
    "transaction_payload" in payload &&
    payload.transaction_payload &&
    "type" in payload.transaction_payload &&
    payload.transaction_payload.type === "entry_function_payload"
  ) {
    return payload.transaction_payload as Types.TransactionPayload_EntryFunctionPayload;
  }
  return null;
}

/**
 * Format an argument value for compact tooltip display.
 */
function formatArgDisplay(value: unknown): string {
  if (typeof value === "string") {
    // Address: 0x + 64 hex chars
    if (/^0x[0-9a-fA-F]{1,64}$/.test(value) && value.length > 10) {
      return `${value.slice(0, 6)}…${value.slice(-4)}`;
    }
    // Pure numeric string → thousands separator
    if (/^\d+$/.test(value)) {
      return BigInt(value).toLocaleString();
    }
    // Short string → as-is, long string → truncate
    if (value.length > 20) {
      return `${value.slice(0, 18)}…`;
    }
    return value;
  }
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    // Short arrays with simple (non-nested) values: expand inline
    if (
      value.length <= 3 &&
      value.every((v) => typeof v !== "object" || v === null)
    ) {
      return `[${value.map((v) => formatArgDisplay(v)).join(", ")}]`;
    }
    return `[${value.length} items]`;
  }
  if (typeof value === "object" && value !== null) {
    // Object<T> types commonly have an "inner" field with the address
    const obj = value as Record<string, unknown>;
    if ("inner" in obj && typeof obj.inner === "string") {
      return formatArgDisplay(obj.inner);
    }
    // Single-key objects: show the value directly
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      return formatArgDisplay(obj[keys[0]]);
    }
    return "{…}";
  }
  return String(value);
}

/**
 * Format a type_argument for generic display.
 * e.g. "0x1::aptos_coin::AptosCoin" → "MovementCoin"
 */
function formatTypeArgShort(typeArg: string): string {
  const parts = typeArg.split("::");
  if (parts.length >= 3) {
    return formatMovementPath(parts[parts.length - 1]);
  }
  return formatMovementPath(typeArg);
}

function FunctionSignature({
  functionName,
  params,
  args,
  typeArgs,
  isLoading,
}: {
  functionName: string;
  params: { name: string; type: string }[] | null;
  args: unknown[];
  typeArgs: string[];
  isLoading?: boolean;
}) {
  // Merge param names with actual argument values
  const mergedParams = args.map((value, i) => ({
    name: params?.[i]?.name ?? `arg_${i}`,
    value: formatArgDisplay(value),
  }));

  const typeArgDisplay =
    typeArgs.length > 0
      ? `<${typeArgs.map(formatTypeArgShort).join(", ")}>`
      : "";

  if (isLoading) {
    return (
      <span className="text-primary font-medium">
        {functionName}
        {typeArgDisplay && (
          <span className="text-blue-400">{typeArgDisplay}</span>
        )}
        <span className="text-muted-foreground">(</span>
        <span className="text-muted-foreground/80 inline-flex gap-[2px] [&>span]:animate-bounce">
          <span className="[animation-delay:0ms]">.</span>
          <span className="[animation-delay:150ms]">.</span>
          <span className="[animation-delay:300ms]">.</span>
        </span>
        <span className="text-muted-foreground">)</span>
      </span>
    );
  }

  if (mergedParams.length === 0) {
    return (
      <span className="text-primary font-medium">
        {functionName}
        {typeArgDisplay && (
          <span className="text-blue-400">{typeArgDisplay}</span>
        )}
        ()
      </span>
    );
  }

  return (
    <>
      <span className="text-primary font-medium">{functionName}</span>
      {typeArgDisplay && (
        <span className="text-blue-400">{typeArgDisplay}</span>
      )}
      <span className="text-muted-foreground">(</span>
      {mergedParams.map((p, i) => (
        <div key={i} className="pl-4 break-all">
          <span className="text-foreground">{p.name}</span>
          <span className="text-muted-foreground">: </span>
          <span className="text-purple-400">{p.value}</span>
          {i < mergedParams.length - 1 && <span className="text-muted-foreground">,</span>}
        </div>
      ))}
      <span className="text-muted-foreground">)</span>
    </>
  );
}

function TooltipActionSummary({ action }: { action: ParsedAction }) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Action header: description + badge */}
      <div className="flex items-center gap-1.5 flex-wrap text-sm">
        {action.type === "transfer" && action.details?.metadata && action.details?.amount ? (
          <FaTransferDescription
            amount={action.details.amount}
            metadataAddress={action.details.metadata}
          />
        ) : (
          <span className="font-medium">{action.description}</span>
        )}
        {action.type === "swap" && (
          <DexBadge
            eventType={action.details?.dexEventType}
            fallbackName={action.details?.dex}
          />
        )}
        {(action.type === "stake" || action.type === "unstake" || action.type === "claim") &&
          action.details?.contract && (
            <StakingPoolBadge poolAddress={action.details.contract} />
          )}
        {action.type === "contract_call" && action.details?.contract && (
          <ContractBadge contractAddress={action.details.contract} />
        )}
      </div>

      {/* Action details */}
      {action.details && (
        <div className="text-sm text-muted-foreground space-y-1">
          {/* From → To */}
          {action.details.from && action.details.to && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs">{`${action.details.from.slice(0, 6)}...${action.details.from.slice(-4)}`}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-mono text-xs">{`${action.details.to.slice(0, 6)}...${action.details.to.slice(-4)}`}</span>
            </div>
          )}
          {/* Swap In → Out */}
          {(action.details.amountIn || action.details.amountOut) && (
            <div className="flex items-center gap-1.5 flex-wrap [&_span]:!inline [&_a]:!inline [&_img]:!inline">
              {action.details.amountIn && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">In:</span>
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
                  <span className="text-muted-foreground text-xs">Out:</span>
                  <TokenAmount
                    amount={action.details.amountOut}
                    metadataAddress={action.details.metadataOut}
                  />
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionFunctionWithSource({
  transaction,
  address,
  moduleName,
  functionName,
  functionFullStr,
  args,
  typeArgs,
  className,
}: {
  transaction?: Types.Transaction;
  address: string;
  moduleName: string;
  functionName: string;
  functionFullStr: string;
  args: unknown[];
  typeArgs: string[];
  className?: string;
}) {
  const { hasSource } = useContractSourceAvailability(address);
  const { params, isLoading: paramsLoading } = useGetFunctionParams(functionFullStr);
  const description = getFunctionDescription(functionFullStr);
  const displayName = description ?? functionName;

  const actions = useMemo(
    () => (transaction ? parseTransactionActions(transaction) : []),
    [transaction],
  );
  const primaryAction = actions[0];

  // Rich action types: summary alone is sufficient, no function signature needed
  const RICH_ACTION_TYPES = new Set<ParsedAction["type"]>([
    "transfer",
    "swap",
    "stake",
    "unstake",
    "claim",
    "deploy",
    "coin_mint",
    "coin_burn",
  ]);

  const isRichAction = primaryAction && RICH_ACTION_TYPES.has(primaryAction.type);
  // Generic types: show function signature as primary content
  const showSignature = !isRichAction;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/account/${address}/modules/write/${moduleName}/${functionName}`}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-all duration-200 text-sm max-w-[180px]",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {hasSource && (
              <FileCheck className="size-[16] text-white fill-blue-500 shrink-0" />
            )}
            <span className="truncate">{displayName}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-3 max-w-80 sm:max-w-100">
          <div className="flex flex-col gap-0">
            {/* Action summary (always shown when available) */}
            {primaryAction && (
              <div className="[&_span]:!inline-flex [&_svg]:!inline [&_a]:!inline-flex [&_img]:!inline">
                <TooltipActionSummary action={primaryAction} />
              </div>
            )}

            {/* Function signature: only for generic action types */}
            {showSignature && (
              <div className={cn("space-y-1", primaryAction && "mt-2")}>
                <div className="font-mono text-xs bg-black/30 p-2 rounded border border-border/50 [&_span]:!inline">
                  <FunctionSignature functionName={functionName} params={params} args={args} typeArgs={typeArgs} isLoading={paramsLoading} />
                </div>
              </div>
            )}

            {hasSource && (
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded bg-blue-500/15 border border-blue-500/20 text-white [&_span]:!inline [&_svg]:!inline",
                (isRichAction || showSignature) && "mt-2",
              )}>
                <FileCheck size={20} className="text-white fill-blue-500 shrink-0" />
                <span className="text-xs">This contract is open source and the source code is available for viewing.</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

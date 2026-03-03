"use client";

import Link from "next/link";
import { Types } from "aptos";
import { FileCheck } from "lucide-react";
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

interface TransactionFunctionProps {
  transaction: Types.Transaction;
  className?: string;
}

export function TransactionFunction({
  transaction,
  className,
}: TransactionFunctionProps) {
  if (!("payload" in transaction)) {
    return "-";
  }

  if (transaction.payload.type === "script_payload") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground",
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
            "inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground",
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
      <span className={cn("text-muted-foreground", className)}>
        {functionFullStr}
      </span>
    );
  }

  const [address, moduleName, functionName] = parts;

  // Extract actual arguments and type_arguments from the payload
  const entryPayload = getEntryPayload(transaction.payload);

  return (
    <TransactionFunctionWithSource
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
      <span className="text-guild-green-500 font-medium">
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
      <span className="text-guild-green-500 font-medium">
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
      <span className="text-guild-green-500 font-medium">{functionName}</span>
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

function TransactionFunctionWithSource({
  address,
  moduleName,
  functionName,
  functionFullStr,
  args,
  typeArgs,
  className,
}: {
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/account/${address}/modules/write/${moduleName}/${functionName}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md transition-all duration-200 text-sm",
              description
                ? "px-2 py-1 bg-primary/15 text-primary font-medium hover:bg-primary/25"
                : "py-0.5 h-[30px] font-mono text-primary hover:bg-primary/10",
              "max-w-[180px]",
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
          <div className="flex flex-col gap-3 [&_span]:!block [&_svg]:!block">
            <div className="space-y-1">
              <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                Address
              </span>
              <div className="font-mono text-xs text-white break-all bg-muted/30 p-2 rounded border border-border/50 leading-relaxed">
                {address}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                  Module
                </span>
                <div className="font-mono text-xs text-foreground bg-muted/30 p-2 rounded border border-border/50 break-all whitespace-pre-wrap">
                  {formatMovementPath(moduleName)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                  Function
                </span>
                <div className="font-mono text-xs bg-primary/5 p-2 rounded border border-primary/10 [&_span]:!inline">
                  <FunctionSignature functionName={functionName} params={params} args={args} typeArgs={typeArgs} isLoading={paramsLoading} />
                </div>
              </div>
            </div>

            {hasSource && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-blue-500/15 border border-blue-500/20 text-white">
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

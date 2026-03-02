"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";
import Link from "next/link";
import { ListTree, ChevronDown, ChevronUp } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Types } from "aptos";
import { formatMovementPath } from "@/utils";
import {
  useGetFunctionParams,
  type ResolvedParam,
} from "@/hooks/accounts/useGetFunctionParams";

interface PayloadDecoderProps {
  payload: Types.TransactionPayload | null;
  className?: string;
}

interface DecodedArgument {
  index: number;
  name: string;
  type: string;
  value: unknown;
  displayValue: string;
}

// Known function signatures for better decoding
const KNOWN_FUNCTIONS: Record<
  string,
  { args: Array<{ name: string; type: string }> }
> = {
  "0x1::coin::transfer": {
    args: [
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::aptos_account::transfer": {
    args: [
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::aptos_account::transfer_coins": {
    args: [
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::primary_fungible_store::transfer": {
    args: [
      { name: "metadata", type: "Object<Metadata>" },
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::object::transfer": {
    args: [
      { name: "object", type: "Object<T>" },
      { name: "to", type: "address" },
    ],
  },
  "0x1::delegation_pool::add_stake": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::delegation_pool::unlock": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::delegation_pool::withdraw": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::managed_coin::register": {
    args: [],
  },
  "0x1::managed_coin::mint": {
    args: [
      { name: "dst_addr", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::managed_coin::burn": {
    args: [
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::coin::register": {
    args: [],
  },
  "0x1::code::publish_package_txn": {
    args: [
      { name: "metadata_serialized", type: "vector<u8>" },
      { name: "code", type: "vector<vector<u8>>" },
    ],
  },
  "0x1::aptos_account::create_account": {
    args: [
      { name: "auth_key", type: "address" },
    ],
  },
  "0x1::aptos_account::batch_transfer": {
    args: [
      { name: "recipients", type: "vector<address>" },
      { name: "amounts", type: "vector<u64>" },
    ],
  },
  "0x1::aptos_account::batch_transfer_coins": {
    args: [
      { name: "recipients", type: "vector<address>" },
      { name: "amounts", type: "vector<u64>" },
    ],
  },
  "0x1::resource_account::create_resource_account": {
    args: [
      { name: "seed", type: "vector<u8>" },
    ],
  },
  "0x1::resource_account::create_resource_account_and_publish_package": {
    args: [
      { name: "seed", type: "vector<u8>" },
      { name: "metadata_serialized", type: "vector<u8>" },
      { name: "code", type: "vector<vector<u8>>" },
    ],
  },
  "0x1::multisig_account::create_with_owners": {
    args: [
      { name: "additional_owners", type: "vector<address>" },
      { name: "num_signatures_required", type: "u64" },
      { name: "metadata_keys", type: "vector<String>" },
      { name: "metadata_values", type: "vector<vector<u8>>" },
    ],
  },
  "0x1::account::rotate_authentication_key": {
    args: [
      { name: "from_scheme", type: "u8" },
      { name: "from_public_key_bytes", type: "vector<u8>" },
      { name: "to_scheme", type: "u8" },
      { name: "to_public_key_bytes", type: "vector<u8>" },
      { name: "cap_rotate_key", type: "vector<u8>" },
      { name: "cap_update_table", type: "vector<u8>" },
    ],
  },
  "0x1::delegation_pool::reactivate_stake": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::aptos_governance::create_proposal": {
    args: [
      { name: "stake_pool", type: "address" },
      { name: "execution_hash", type: "vector<u8>" },
      { name: "metadata_location", type: "vector<u8>" },
      { name: "metadata_hash", type: "vector<u8>" },
    ],
  },
  "0x1::aptos_governance::vote": {
    args: [
      { name: "stake_pool", type: "address" },
      { name: "proposal_id", type: "u64" },
      { name: "should_pass", type: "bool" },
    ],
  },
  "0x1::aptos_account::fungible_transfer_only": {
    args: [
      { name: "metadata", type: "Object<Metadata>" },
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  // 0x4:: Digital Assets (Token V2)
  "0x4::aptos_token::mint": {
    args: [
      { name: "collection", type: "Object<Collection>" },
      { name: "description", type: "String" },
      { name: "name", type: "String" },
      { name: "uri", type: "String" },
      { name: "property_keys", type: "vector<String>" },
      { name: "property_types", type: "vector<String>" },
      { name: "property_values", type: "vector<vector<u8>>" },
    ],
  },
  "0x4::aptos_token::mint_soul_bound": {
    args: [
      { name: "collection", type: "Object<Collection>" },
      { name: "description", type: "String" },
      { name: "name", type: "String" },
      { name: "property_keys", type: "vector<String>" },
      { name: "property_types", type: "vector<String>" },
      { name: "property_values", type: "vector<vector<u8>>" },
      { name: "uri", type: "String" },
      { name: "soul_bound_to", type: "address" },
    ],
  },
  "0x4::aptos_token::burn": {
    args: [
      { name: "token", type: "Object<Token>" },
    ],
  },
  "0x4::aptos_token::freeze_transfer": {
    args: [
      { name: "token", type: "Object<Token>" },
    ],
  },
  "0x4::aptos_token::unfreeze_transfer": {
    args: [
      { name: "token", type: "Object<Token>" },
    ],
  },
  "0x4::aptos_token::set_description": {
    args: [
      { name: "token", type: "Object<Token>" },
      { name: "description", type: "String" },
    ],
  },
  "0x4::aptos_token::set_uri": {
    args: [
      { name: "token", type: "Object<Token>" },
      { name: "uri", type: "String" },
    ],
  },
  // 0x3:: Legacy Token V1
  "0x3::token::create_token_script": {
    args: [
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "description", type: "String" },
      { name: "supply", type: "u64" },
      { name: "maximum", type: "u64" },
      { name: "uri", type: "String" },
      { name: "royalty_payee_address", type: "address" },
      { name: "royalty_points_denominator", type: "u64" },
      { name: "royalty_points_numerator", type: "u64" },
      { name: "mutate_setting", type: "vector<bool>" },
      { name: "property_keys", type: "vector<String>" },
      { name: "property_values", type: "vector<vector<u8>>" },
      { name: "property_types", type: "vector<String>" },
    ],
  },
  "0x3::token::mint_script": {
    args: [
      { name: "token_data_address", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x3::token_transfers::offer_script": {
    args: [
      { name: "receiver", type: "address" },
      { name: "creator", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "property_version", type: "u64" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x3::token_transfers::claim_script": {
    args: [
      { name: "sender", type: "address" },
      { name: "creator", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "property_version", type: "u64" },
    ],
  },
  "0x3::token_transfers::cancel_offer_script": {
    args: [
      { name: "receiver", type: "address" },
      { name: "creator", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "property_version", type: "u64" },
    ],
  },
};

function decodeArguments(
  func: string,
  args: unknown[],
  _typeArgs: string[],
  dynamicParams: ResolvedParam[] | null,
): DecodedArgument[] {
  const known = KNOWN_FUNCTIONS[func];
  const decoded: DecodedArgument[] = [];

  args.forEach((arg, index) => {
    // Priority 1: KNOWN_FUNCTIONS hardcoded table
    const knownArg = known?.args[index];
    // Priority 2: Dynamic ABI + source code
    const dynamicArg = dynamicParams?.[index];
    // Priority 3: Inference fallback
    const name = knownArg?.name ?? dynamicArg?.name ?? `arg_${index}`;
    const type = knownArg?.type ?? dynamicArg?.type ?? inferType(arg);
    const displayValue = formatArgValue(arg, type);

    decoded.push({
      index,
      name,
      type,
      value: arg,
      displayValue,
    });
  });

  return decoded;
}

function inferType(value: unknown): string {
  if (typeof value === "string") {
    if (value.startsWith("0x") && value.length === 66) return "address";
    if (value.startsWith("0x")) return "hex";
    if (/^\d+$/.test(value)) return "u64";
    return "string";
  }
  if (typeof value === "number") return "u64";
  if (typeof value === "boolean") return "bool";
  if (Array.isArray(value)) return "vector";
  return "unknown";
}

function formatArgValue(value: unknown, type: string): string {
  if (type === "address" && typeof value === "string") {
    return value;
  }
  if (type === "u64" && typeof value === "string") {
    // Format large numbers with commas
    return BigInt(value).toLocaleString();
  }
  if (type === "vector<u8>" && typeof value === "string") {
    // Hex encoded bytes
    return `${value.slice(0, 20)}...`;
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  return String(value);
}

export function PayloadDecoder({ payload, className }: PayloadDecoderProps) {
  const [viewMode, setViewMode] = useState<"decoded" | "raw">("decoded");
  const [showTypeArgs, setShowTypeArgs] = useState(false);

  // Extract entry payload and function path before hooks (rules of hooks: no conditional calls)
  const isEntryFunction = payload?.type === "entry_function_payload";
  const isScript = payload?.type === "script_payload";
  const isMultisig = payload?.type === "multisig_payload";

  const entryPayload = isEntryFunction
    ? (payload as Types.TransactionPayload_EntryFunctionPayload)
    : isMultisig &&
      payload &&
      "transaction_payload" in payload &&
      payload.transaction_payload
      ? (payload.transaction_payload as Types.TransactionPayload_EntryFunctionPayload)
      : null;

  const func = entryPayload?.function || "";
  const isKnown = func in KNOWN_FUNCTIONS;

  // Dynamically resolve param names/types from ABI + source code (only for unknown functions)
  const { params: dynamicParams, isLoading: paramsLoading } =
    useGetFunctionParams(isKnown || !func ? null : func);

  if (!payload) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No payload data available
      </div>
    );
  }

  const args = entryPayload?.arguments || [];
  const typeArgs = entryPayload?.type_arguments || [];
  const decodedArgs = entryPayload
    ? decodeArguments(func, args, typeArgs, dynamicParams)
    : [];

  const funcParts = func.split("::");
  const moduleAddr = funcParts[0] || "";
  const moduleName = funcParts[1] || "";
  const funcName = funcParts[2] || "";

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <ToggleGroup value={viewMode} onValueChange={(v) => setViewMode(v as "decoded" | "raw")}>
        <ToggleGroupItem value="decoded">
          <ListTree className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="raw">
          RAW
        </ToggleGroupItem>
      </ToggleGroup>

      {viewMode === "raw" ? (
        <JsonViewer data={payload} initialDepth={2} />
      ) : (
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden divide-y divide-border/20">
          {/* Payload Type */}
          <div className="px-5 py-3 flex items-center gap-3 bg-muted/20">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Type</span>
            <Badge variant="secondary" className="capitalize">
              {payload.type.replace(/_/g, " ")}
            </Badge>
            {isMultisig && (
              <Badge variant="outline" className="text-orange-500">
                Multisig
              </Badge>
            )}
          </div>

          {isScript && (
            <div className="px-5 py-4">
              <JsonViewer data={payload} initialDepth={1} />
            </div>
          )}

          {entryPayload && (
            <>
              {/* Function */}
              <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <div className="text-sm text-muted-foreground uppercase tracking-wider shrink-0">Function</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/account/${moduleAddr}/modules/code/${moduleName}/${funcName}`}
                        className="font-mono text-base text-primary hover:bg-primary/10 rounded-md px-1 py-0.5 transition-colors overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden block whitespace-nowrap"
                      >
                        {moduleAddr.length <= 10 ? moduleAddr : `${moduleAddr.slice(0, 6)}...${moduleAddr.slice(-4)}`}::{formatMovementPath(moduleName)}::{funcName}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-80 sm:max-w-100">
                      <div className="flex flex-col gap-3">
                        <div className="space-y-1">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                            Address
                          </span>
                          <div className="font-mono text-xs text-white break-all bg-muted/30 p-2 rounded border border-border/50 leading-relaxed">
                            {moduleAddr}
                          </div>
                        </div>
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
                          <div className="font-mono text-xs bg-primary/5 p-2 rounded border border-primary/10 [&_span]:inline">
                            <span className="text-guild-green-500 font-medium">{funcName}</span>
                            <span className="text-muted-foreground">(</span>
                            {decodedArgs.length <= 2 ? (
                              // Inline for short signatures
                              decodedArgs.map((arg, i) => (
                                <span key={arg.index}>
                                  {i > 0 && <span className="text-muted-foreground">, </span>}
                                  <span className="text-foreground">{arg.name}</span>
                                  <span className="text-muted-foreground">: </span>
                                  <span className="text-purple-400">{arg.type}</span>
                                </span>
                              ))
                            ) : (
                              // One param per line for long signatures
                              decodedArgs.map((arg, i) => (
                                <div key={arg.index} className="pl-4 break-all">
                                  <span className="text-foreground">{arg.name}</span>
                                  <span className="text-muted-foreground">: </span>
                                  <span className="text-purple-400">{arg.type}</span>
                                  {i < decodedArgs.length - 1 && <span className="text-muted-foreground">,</span>}
                                </div>
                              ))
                            )}
                            <span className="text-muted-foreground">)</span>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Type Arguments */}
              {typeArgs.length > 0 && (
                <div className="px-5 py-3">
                  <button
                    onClick={() => setShowTypeArgs(!showTypeArgs)}
                    className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full cursor-pointer"

                  >
                    <span>Type Arguments ({typeArgs.length})</span>
                    {showTypeArgs ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showTypeArgs && (
                    <div className="mt-2 space-y-1">
                      {typeArgs.map((typeArg, i) => (
                        <div
                          key={i}
                          className="font-mono text-sm bg-muted/30 px-3 py-1.5 rounded-lg break-all"
                        >
                          <span className="text-muted-foreground/60 mr-2">{i}</span>
                          <span className="text-purple-400">{formatMovementPath(typeArg)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Arguments */}
              <div>
                <div className="px-5 py-3 text-sm text-muted-foreground uppercase tracking-wider bg-muted/20">
                  Arguments ({decodedArgs.length})
                  {paramsLoading && !isKnown && (
                    <span className="ml-2 text-xs opacity-50 animate-pulse">resolving...</span>
                  )}
                </div>
                {decodedArgs.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-muted-foreground">No arguments</div>
                ) : (
                  decodedArgs.map((arg) => (
                    <ArgumentRow key={arg.index} arg={arg} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function tryParseJson(value: unknown): { parsed: true; data: unknown } | { parsed: false } {
  if (typeof value !== "string") return { parsed: false };
  const trimmed = value.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return { parsed: false };
  try {
    return { parsed: true, data: JSON.parse(trimmed) };
  } catch {
    return { parsed: false };
  }
}

function ArgumentRow({ arg }: { arg: DecodedArgument }) {
  const isAddress = arg.type === "address" || arg.type === "hex";
  const isComplex =
    Array.isArray(arg.value) ||
    (typeof arg.value === "object" && arg.value !== null);
  const jsonResult = tryParseJson(arg.value);
  const isLargeValue =
    typeof arg.value === "string" && arg.value.length > 100;

  return (
    <div className="border-b border-border/20 last:border-0 px-4 py-3">
      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
        <span className="text-base text-muted-foreground/50">{arg.index}</span>
        <span className="text-base font-medium text-muted-foreground">{arg.name}</span>
        <Badge variant="outline" className="text-xs font-mono px-1.5 py-0 shrink-0">
          {arg.type}
        </Badge>
      </div>
      <div className="min-w-0 pl-4">
        {isAddress && typeof arg.value === "string" ? (
          <CopyableAddress
            address={arg.value}
            href={`/account/${arg.value}`}
            showFull
          />
        ) : isComplex ? (
          <JsonViewer data={arg.value} initialDepth={1} />
        ) : jsonResult.parsed ? (
          <JsonViewer data={jsonResult.data} initialDepth={1} />
        ) : isLargeValue ? (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              {(arg.value as string).slice(0, 60)}...
              <span className="ml-1 opacity-60">({(arg.value as string).length} chars)</span>
            </summary>
            <div className="mt-2 font-mono text-base break-all bg-muted/30 px-3 py-2 rounded-lg max-h-40 overflow-auto">
              {String(arg.value)}
            </div>
          </details>
        ) : typeof arg.value === "boolean" ? (
          <span className={`font-mono text-base ${arg.value ? "text-emerald-400" : "text-rose-400"}`}>
            {String(arg.value)}
          </span>
        ) : (
          <span className="font-mono text-base break-all">{arg.displayValue}</span>
        )}
      </div>
    </div>
  );
}

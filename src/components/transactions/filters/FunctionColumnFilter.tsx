"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";
import { getTransactionFunction } from "@/utils/transaction";
import { TransactionRowData } from "../types";

interface FunctionColumnFilterProps {
  value: string | null;
  onChange: (functionName: string | null) => void;
  /** Current page data to derive function options from */
  transactions: TransactionRowData[];
}

export function FunctionColumnFilter({
  value,
  onChange,
  transactions,
}: FunctionColumnFilterProps) {
  const [search, setSearch] = useState("");
  const isActive = value !== null;

  // Derive unique function names from current page
  const functionOptions = useMemo(() => {
    const fns = new Set<string>();
    for (const { transaction } of transactions) {
      const fn = getTransactionFunction(transaction);
      if (fn) fns.add(fn);
    }
    return Array.from(fns).sort();
  }, [transactions]);

  const filteredOptions = useMemo(() => {
    if (!search) return functionOptions;
    const q = search.toLowerCase();
    return functionOptions.filter((fn) => fn.toLowerCase().includes(q));
  }, [search, functionOptions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? `Fn: ${value}` : "Function"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-background">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onChange(null);
            setSearch("");
          }}
          className={cn(!isActive && "font-medium")}
        >
          All Functions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.map((fn) => (
            <DropdownMenuItem
              key={fn}
              onClick={() => {
                onChange(fn);
                setSearch("");
              }}
              className={cn(
                "font-mono text-xs",
                value === fn && "font-medium",
              )}
            >
              {fn}
            </DropdownMenuItem>
          ))}
          {filteredOptions.length === 0 && (
            <div className="px-2 py-4 text-sm text-center text-muted-foreground">
              No functions found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { Funnel, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";

interface AddressColumnFilterProps {
  label: string;
  value: string | null;
  onChange: (address: string | null) => void;
}

export function AddressColumnFilter({
  label,
  value,
  onChange,
}: AddressColumnFilterProps) {
  const [input, setInput] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const isActive = value !== null;

  const handleApply = () => {
    const trimmed = input.trim();
    onChange(trimmed || null);
    setOpen(false);
  };

  const handleClear = () => {
    setInput("");
    onChange(null);
    setOpen(false);
  };

  const truncated = value
    ? `${value.slice(0, 6)}..${value.slice(-4)}`
    : null;

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={(o: boolean) => {
      setOpen(o);
      if (o) setInput(value ?? "");
    }}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? truncated : label}
          <span className="relative">
            <Funnel className="h-3.5 w-3.5" />
            {isActive && (
              <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 p-3 rounded-2xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-border bg-background">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
          <input
            placeholder="Search by address e.g. 0x.."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {input && (
            <button onClick={() => setInput("")} className="shrink-0">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" className="flex-1" onClick={handleApply}>
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="flex-1 text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

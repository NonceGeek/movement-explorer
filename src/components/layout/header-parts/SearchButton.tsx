"use client";

import { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  MagnifyingGlass,
} from "@movementlabsxyz/movement-design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchBar } from "@/components/search";

export function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            aria-label="Search"
          >
            <MagnifyingGlass size={20} weight="regular" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Search transactions, blocks, accounts</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Movement Explorer</DialogTitle>
          </DialogHeader>
          <SearchBar variant="default" />
        </DialogContent>
      </Dialog>
    </>
  );
}

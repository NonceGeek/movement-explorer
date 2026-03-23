"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@movementlabsxyz/movement-design-system";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/styling";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { NavDropdown } from "../types";

export interface NavigationDropdownProps {
  label: string;
  items: NavDropdown["items"];
}

export function NavigationDropdown({ label, items }: NavigationDropdownProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const handleOpen = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "transition-all duration-200 gap-1",
          isActive
            ? "text-primary-foreground bg-primary"
            : "text-muted-foreground",
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={12}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn(
          "rounded-2xl p-3 min-w-48 space-y-1.5",
          "bg-card/95 backdrop-blur-xl",
          "border border-border/60",
          "shadow-xl shadow-black/10",
        )}
      >
        {items.map((item) => {
          const isItemMatch =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          // Only highlight if no other sibling item has a more specific (longer) match
          const hasMoreSpecificMatch = isItemMatch && items.some(
            (other) =>
              other.href !== item.href &&
              other.href.length > item.href.length &&
              (pathname === other.href || pathname.startsWith(`${other.href}/`)),
          );
          const isItemActive = isItemMatch && !hasMoreSpecificMatch;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  "cursor-pointer rounded-xl px-5 py-2.5 text-base font-medium",
                  "transition-all duration-200 ease-out uppercase",
                  isItemActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted/60",
                )}
              >
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

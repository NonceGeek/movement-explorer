"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@movementlabsxyz/movement-design-system";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
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
            : "text-muted-foreground"
        )}
      >
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        {items.map((item) => {
          const isItemActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  "cursor-pointer",
                  isItemActive && "bg-primary text-primary-foreground"
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

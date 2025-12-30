"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@movementlabsxyz/movement-design-system";
import { cn } from "@/lib/utils";

export interface NavigationLinkProps {
  href: string;
  label: string;
}

export function NavigationLink({ href, label }: NavigationLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "relative transition-all duration-200",
        isActive
          ? "text-foreground bg-moveus-marigold-500/10"
          : "text-muted-foreground"
      )}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-moveus-marigold-500 rounded-full" />
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@movementlabsxyz/movement-design-system";
import { cn } from "@/utils/styling";

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
        "transition-all duration-200",
        isActive
          ? "text-primary-foreground bg-primary"
          : "text-muted-foreground"
      )}
    >
      {label}
    </Link>
  );
}

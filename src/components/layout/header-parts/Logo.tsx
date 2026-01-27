"use client";

import Link from "next/link";
import { Branding } from "@movementlabsxyz/movement-design-system";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <Branding
        theme="industries"
        variant="logomark"
        color="white"
        className="h-8 w-8"
      />
      <span className="text-2xl font-heading font-bold text-white">
        MoveScan
      </span>
    </Link>
  );
}

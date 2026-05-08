"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Branding } from "@movementlabsxyz/movement-design-system";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Standard next-themes hydration guard — intentional setState in effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // SSR + first paint: use "white" so the dark-default initial render isn't
  // a flash of black-on-cream. After mount, follow the resolved theme.
  const brandingColor = mounted && resolvedTheme === "light" ? "black" : "white";

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <Branding
        theme="industries"
        variant="logomark"
        color={brandingColor}
        className="h-8 w-8"
      />
      <span className="text-2xl font-heading font-bold text-foreground">
        MoveScan
      </span>
    </Link>
  );
}

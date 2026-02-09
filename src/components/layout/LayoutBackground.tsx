"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface LayoutBackgroundProps {
  children: React.ReactNode;
}

export function LayoutBackground({ children }: LayoutBackgroundProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Ensure window scrolls to top on navigation since we removed the container scroll
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Layer 1: Gradient glass overlay background */}
      <div
        className="fixed inset-0 gradient-glass-overlay"
        aria-hidden="true"
      />

      {/* Layer 2: Fixed dotted pattern - only on home page */}
      {pathname === "/" && (
        <div
          className="fixed inset-0 pointer-events-none bg-dotted-pattern bg-dotted-pattern-mask z-10"
          aria-hidden="true"
        />
      )}

      {/* Layer 3: Fixed glow effects at top */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-guild-green-500/15 blur-[100px] rounded-full pointer-events-none z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-8 left-1/2 -translate-x-1/2 w-100 h-[200px] bg-byzantine-blue-500/10 blur-[80px] rounded-full pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Layer 4: Content */}
      <div className="relative z-20 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

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
      {/* Subtle ambient glow at top — sienna in light, cream in dark */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-(--ms-accent)/10 blur-[100px] rounded-full pointer-events-none z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-8 left-1/2 -translate-x-1/2 w-100 h-[200px] bg-(--ms-accent-2)/8 blur-[80px] rounded-full pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-20 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

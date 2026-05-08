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
      {/* Very subtle ambient atmosphere — barely visible, gives the page a
          faint warmth without competing with content. */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-(--ms-accent)/4 blur-[160px] rounded-full pointer-events-none z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-8 left-1/2 -translate-x-1/2 w-[500px] h-[220px] bg-(--ms-accent-2)/3 blur-[140px] rounded-full pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-20 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

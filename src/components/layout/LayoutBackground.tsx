"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface LayoutBackgroundProps {
  children: React.ReactNode;
}

export function LayoutBackground({ children }: LayoutBackgroundProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset scroll position when pathname changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    // Fallback for window scroll
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 flex flex-col min-h-0 gradient-glass-overlay overflow-y-auto"
    >
      {children}
    </div>
  );
}

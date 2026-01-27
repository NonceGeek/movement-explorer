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
    <div className="flex-1 flex flex-col gradient-glass-overlay">
      {children}
    </div>
  );
}

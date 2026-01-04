"use client";

import { DottedBackground } from "@movementlabsxyz/movement-design-system";

interface LayoutBackgroundProps {
  children: React.ReactNode;
}

export function LayoutBackground({ children }: LayoutBackgroundProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 gradient-glass-overlay">
      {children}
    </div>
  );
}

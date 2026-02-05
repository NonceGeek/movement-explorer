"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/styling";

interface SimpleChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * SimpleChartCard - Chart card without day range toggle
 * Features:
 * - Simple card layout with title
 * - Smooth transition effects for content changes
 */
export default function SimpleChartCard({
  title,
  children,
  className,
}: SimpleChartCardProps) {
  return (
    <Card
      className={cn(
        "border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Card Header with Title */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {/* Chart Content with transition */}
      <div className="p-4 transition-opacity duration-300">{children}</div>
    </Card>
  );
}

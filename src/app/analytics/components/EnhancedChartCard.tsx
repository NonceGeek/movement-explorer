"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import ChartTitle from "./ChartTitle";
import { cn } from "@/utils/styling";

export interface EnhancedChartCardProps {
  title: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * EnhancedChartCard - Etherscan-inspired chart card wrapper
 * Features:
 * - Lighter borders (border-border/30)
 * - Subtle shadow with hover elevation
 * - Smooth hover scale effect
 * - Consistent padding (1.25rem)
 */
export default function EnhancedChartCard({
  title,
  tooltip,
  children,
  className,
}: EnhancedChartCardProps) {
  return (
    <Card
      className={cn(
        // Etherscan-style borders and shadows
        "border border-border/30 bg-card/50",
        "shadow-sm hover:shadow-md",
        // Smooth transitions
        "transition-all duration-300",
        // Subtle hover scale effect
        "hover:scale-[1.01]",
        className
      )}
    >
      <CardHeader className="pb-2">
        <ChartTitle label={title} tooltip={tooltip} />
      </CardHeader>
      <CardContent className="p-5">
        {children}
      </CardContent>
    </Card>
  );
}

import { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/utils/styling";

export interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  tooltip?: string;
  trend?: "up" | "down" | "neutral";
  link?: string;
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  icon,
  label,
  value,
  subValue,
  tooltip,
  trend,
  link,
  loading = false,
  className,
}: StatsCardProps) {
  const content = (
    <Card
      className={cn(
        "bg-card border-border hover:border-primary/50 transition-all",
        link && "cursor-pointer",
        className
      )}
    >
      <CardContent className="p-6">
        {/* Icon + Tooltip */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="focus:outline-none">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground mb-2">{label}</p>

        {/* Main Value */}
        <p className="text-2xl font-heading font-bold mb-1">
          {loading ? (
            <EnhancedSkeleton className="h-8 w-24" />
          ) : (
            value
          )}
        </p>

        {/* Sub Value / Link */}
        {subValue && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            {trend === "down" && (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            {link ? (
              <span className="hover:text-primary transition-colors">
                {subValue}
              </span>
            ) : (
              subValue
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  badge?: string;
  change?: string;
  isLive?: boolean;
  isLoading?: boolean;
}

function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

export function StatCard({
  label,
  value,
  icon,
  badge,
  change,
  isLive,
  isLoading,
}: StatCardProps) {
  return (
    <Card className="p-5 border-border/50 bg-card hover:border-moveus-marigold-500/30 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
        <div className="text-moveus-marigold-500">{icon}</div>
      </div>

      {isLoading ? (
        <Skeleton className="h-9 w-32 mb-2" />
      ) : (
        <div className="text-3xl font-bold font-mono text-foreground mb-2">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {isLive && (
          <Badge
            variant="outline"
            className="gap-1.5 text-guild-green-500 border-guild-green-500/30 bg-guild-green-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-guild-green-500 animate-pulse" />
            Live
          </Badge>
        )}
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
        {change && (
          <span className="text-xs font-medium text-guild-green-500">
            {change}
          </span>
        )}
      </div>
    </Card>
  );
}

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/styling";

export interface SectionCardProps {
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function SectionCard({
  title,
  headerAction,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("bg-card backdrop-blur-sm border border-border/50 rounded-xl", className)}>
      <CardHeader className="border-b border-border/30 py-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading font-semibold">
            {title}
          </CardTitle>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-6 pb-6">{children}</CardContent>
    </Card>
  );
}

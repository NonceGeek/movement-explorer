import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-4",
        className
      )}
    >
      <div className="p-4 bg-muted/30 rounded-full">{icon}</div>
      <div className="text-center max-w-md">
        <h3 className="text-lg font-heading font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <div className="mt-2">
          {action.href ? (
            <Button variant="link" asChild>
              <Link href={action.href}>{action.label} →</Link>
            </Button>
          ) : (
            <Button variant="link" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

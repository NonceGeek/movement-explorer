import { cn } from "@/utils/styling";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface DetailRowProps {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  isLast?: boolean;
  highlight?: boolean;
}

export function DetailRow({
  label,
  tooltip,
  children,
  className,
  labelClassName,
  isLast = false,
  highlight = false,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 py-3.5",
        !isLast && "border-b border-border/30",
        highlight && "bg-primary/5",
        className
      )}
    >
      <div
        className={cn(
          "text-sm text-muted-foreground font-medium flex items-center gap-1.5",
          labelClassName
        )}
      >
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-sm text-foreground break-all">{children}</div>
    </div>
  );
}

interface DetailSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({
  title,
  children,
  className,
}: DetailSectionProps) {
  return (
    <div className={cn("", className)}>
      {title && (
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {title}
        </div>
      )}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden px-5">
        {children}
      </div>
    </div>
  );
}

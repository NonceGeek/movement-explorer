"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewDataNotificationProps {
  onClick: () => void;
  count?: number;
  className?: string;
  visible: boolean;
}

export function NewDataNotification({
  onClick,
  count,
  className,
  visible,
}: NewDataNotificationProps) {
  if (!visible) return null;

  return (
    <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-top-2">
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95 text-sm font-medium",
          className,
        )}
      >
        <ArrowUp size={16} />
        {count ? `Show ${count} new transactions` : "Show new transactions"}
      </button>
    </div>
  );
}

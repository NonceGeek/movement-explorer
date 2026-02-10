"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/utils/styling";

interface NewDataNotificationProps {
  onClick: () => void;
  className?: string;
  visible: boolean;
  isLoading?: boolean;
}

export function NewDataNotification({
  onClick,
  className,
  visible,
  isLoading,
}: NewDataNotificationProps) {
  if (!visible && !isLoading) return null;

  return (
    <button
      onClick={isLoading ? undefined : onClick}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90 transition-all active:scale-95 text-xs sm:text-sm font-medium animate-in fade-in zoom-in duration-300 cursor-pointer",
        isLoading && "opacity-80 cursor-wait",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <ArrowUp size={14} />
      )}
      New
    </button>
  );
}

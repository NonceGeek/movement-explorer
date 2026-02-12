"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoreDetailsToggleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function MoreDetailsToggle({
  children,
  defaultOpen = false,
  className,
}: MoreDetailsToggleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent py-3"
      >
        {isOpen ? (
          <>
            <span>Hide Details</span>
            <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            <span>More Details</span>
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </Button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/30">{children}</div>
        </div>
      </div>
    </div>
  );
}

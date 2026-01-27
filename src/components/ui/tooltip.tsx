"use client";

import * as React from "react";
import {
  Tooltip as DSTooltip,
  TooltipTrigger as DSTooltipTrigger,
  TooltipContent as DSTooltipContent,
  TooltipProvider as DSTooltipProvider,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const TooltipProvider = DSTooltipProvider;

const Tooltip = DSTooltip;

const TooltipTrigger = DSTooltipTrigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof DSTooltipContent>,
  React.ComponentPropsWithoutRef<typeof DSTooltipContent>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DSTooltipContent
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-border/50 bg-popover/95 px-3 py-1.5 text-xs text-popover-foreground shadow-md backdrop-blur-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 [&_span]:hidden [&_svg]:hidden",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

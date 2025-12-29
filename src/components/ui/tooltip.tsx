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
>(({ className, ...props }, ref) => (
  <DSTooltipContent ref={ref} className={cn(className)} {...props} />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

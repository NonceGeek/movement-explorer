import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
declare function TooltipProvider({ delayDuration, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>): import("react/jsx-runtime").JSX.Element;
declare function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
declare function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
    /**
     * The side of the trigger to render the tooltip on
     * @default "top"
     */
    side?: "top" | "right" | "bottom" | "left";
    /**
     * The alignment of the tooltip relative to the trigger
     * @default "center"
     */
    align?: "start" | "center" | "end";
    /**
     * The distance in pixels from the trigger
     * @default 4
     */
    sideOffset?: number;
    /**
     * The offset in pixels along the alignment axis
     * @default 0
     */
    alignOffset?: number;
    /**
     * Whether to show the arrow
     * @default true
     */
    showArrow?: boolean;
};
declare function TooltipContent({ className, side, align, sideOffset, alignOffset, showArrow, children, ...props }: TooltipContentProps): import("react/jsx-runtime").JSX.Element;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
//# sourceMappingURL=tooltip.d.ts.map
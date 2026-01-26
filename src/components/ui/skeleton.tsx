import * as React from "react";
import { Skeleton as DSSkeleton } from "@movementlabsxyz/movement-design-system";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Original Skeleton from design system
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return <DSSkeleton ref={ref} className={cn(className)} {...props} />;
});
Skeleton.displayName = "Skeleton";

/**
 * Enhanced Skeleton with dark-theme optimized colors and multiple variants
 */
const skeletonVariants = cva("bg-muted/50", {
  variants: {
    animation: {
      pulse: "animate-pulse",
      shimmer:
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      static: "",
    },
    shape: {
      default: "rounded-md",
      text: "h-4 rounded-sm",
      avatar: "rounded-full",
      card: "rounded-lg",
      circle: "rounded-full aspect-square",
    },
  },
  defaultVariants: {
    animation: "shimmer",
    shape: "default",
  },
});

export interface EnhancedSkeletonProps
  extends React.ComponentPropsWithoutRef<"div">,
    VariantProps<typeof skeletonVariants> {}

const EnhancedSkeleton = React.forwardRef<HTMLDivElement, EnhancedSkeletonProps>(
  ({ className, animation, shape, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="skeleton"
        className={cn(skeletonVariants({ animation, shape }), className)}
        {...props}
      />
    );
  }
);
EnhancedSkeleton.displayName = "EnhancedSkeleton";

export { Skeleton, EnhancedSkeleton, skeletonVariants };

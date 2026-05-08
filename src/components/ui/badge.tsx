import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import {
  Badge as DSBadge,
  badgeVariants as dsBadgeVariants,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/utils/styling";

/**
 * 1. 导出设计系统的原始 variants 工具
 */
export const badgeVariants = dsBadgeVariants;

/**
 * 2. 定义自定义 Variants 类型
 */
export type CustomBadgeVariant =
  | "custom-example"
  | "success"
  | "error"
  | "warning"
  | "primary";

/**
 * 3. 组合最终的 Variant 类型 (Design System + Custom)
 */
export type BadgeVariant =
  | VariantProps<typeof dsBadgeVariants>["variant"]
  | CustomBadgeVariant;

export interface BadgeProps
  extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof dsBadgeVariants>, "variant"> {
  variant?: BadgeVariant;
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  let resolvedVariant: VariantProps<typeof dsBadgeVariants>["variant"] =
    "default";
  let customClassName = "";

  // 自定义 variant 逻辑 (如果有)
  if (variant === "custom-example") {
    resolvedVariant = "default";
    customClassName = "bg-purple-500 text-white";
  } else if (variant === "success") {
    resolvedVariant = "default"; // Use default structure but override colors
    customClassName =
      "bg-(--ms-good)/15 text-(--ms-good) hover:bg-(--ms-good)/25";
  } else if (variant === "error") {
    resolvedVariant = "default";
    customClassName =
      "bg-(--ms-bad)/15 text-(--ms-bad) hover:bg-(--ms-bad)/25";
  } else if (variant === "warning") {
    resolvedVariant = "default";
    customClassName =
      "bg-(--ms-accent-2)/15 text-(--ms-accent-2) hover:bg-(--ms-accent-2)/25";
  } else if (variant === "primary") {
    resolvedVariant = "default";
    customClassName =
      "bg-primary/10 text-primary hover:bg-primary/20";
  } else {
    resolvedVariant = variant as VariantProps<
      typeof dsBadgeVariants
    >["variant"];
  }

  return (
    <DSBadge
      variant={resolvedVariant}
      asChild={asChild}
      className={cn(customClassName, className)}
      {...props}
    />
  );
}

export { Badge };

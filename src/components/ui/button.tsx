import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import {
  Button as DSButton,
  buttonVariants as dsButtonVariants,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

/**
 * 1. 导出设计系统的原始 variants 工具
 * 注意：这个工具函数只支持设计系统原有的 variant 类型。
 * 如果你需要在一个非 Button 组件（比如 <Link>）上使用自定义的 variant 样式，
 * 建议直接使用 className="..." 或者封装一个新的工具函数。
 */
export const buttonVariants = dsButtonVariants;

/**
 * 2. 定义自定义 Variants 类型
 * 在这里添加你想要“魔改”或新增的按钮类型
 */
export type CustomButtonVariant = "shiny-gold" | "super-danger"; // 示例：你可以随时在这里添加字符串

/**
 * 3. 组合最终的 Variant 类型 (Design System + Custom)
 */
export type ButtonVariant =
  | VariantProps<typeof dsButtonVariants>["variant"]
  | CustomButtonVariant;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof dsButtonVariants>, "variant"> {
  variant?: ButtonVariant;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // 4. 处理自定义 Variant 的逻辑
    // 如果传入的是我们自定义的 variant，我们需要：
    // a. 告诉 DSButton 渲染一个基础样式（通常是 'default' 或 'ghost'，取决于你的 CSS 策略）
    // b. 手动添加我们自定义的样式类

    let resolvedVariant: VariantProps<typeof dsButtonVariants>["variant"] =
      "default";
    let customClassName = "";

    // 检查是否为自定义类型
    if (variant === "shiny-gold") {
      resolvedVariant = "default"; // 基础底子
      customClassName =
        "bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-yellow-600 shadow-lg";
    } else if (variant === "super-danger") {
      resolvedVariant = "destructive";
      customClassName = "animate-pulse border-4 border-red-900 font-black";
    } else {
      // 如果不是自定义的，就认为是 Design System 原有的
      resolvedVariant = variant as VariantProps<
        typeof dsButtonVariants
      >["variant"];
    }

    return (
      <DSButton
        ref={ref}
        variant={resolvedVariant}
        size={size}
        asChild={asChild}
        className={cn(customClassName, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

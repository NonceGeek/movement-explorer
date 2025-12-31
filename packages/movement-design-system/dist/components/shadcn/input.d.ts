import { VariantProps } from 'class-variance-authority';
import * as React from "react";
/**
 * Input component with glass/backdrop blur effect.
 * Based on Figma Design System - Forms/Input/typeable
 *
 * Features:
 * - Glass effect styling (default for all inputs)
 * - Multiple size variants (sm, md, lg)
 * - Icon support (left/right)
 * - Clearable functionality
 * - Error state
 * - Custom cursor color (guild-green-300)
 */
declare const inputVariants: (props?: ({
    variant?: "default" | "error" | "iridescent" | null | undefined;
    size?: "sm" | "lg" | "md" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
interface InputProps extends Omit<React.ComponentProps<"input">, "size">, VariantProps<typeof inputVariants> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    clearable?: boolean;
    onClear?: () => void;
    error?: boolean;
}
declare const Input: React.ForwardRefExoticComponent<Omit<InputProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
export { Input };
//# sourceMappingURL=input.d.ts.map
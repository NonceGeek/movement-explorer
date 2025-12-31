import { VariantProps } from 'class-variance-authority';
import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
declare const toggleGroupVariants: (props?: ({
    variant?: "default" | "contained" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare const toggleGroupItemVariants: (props?: ({
    variant?: "default" | "contained" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
type ToggleGroupSingleProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleGroupVariants> & {
    type: "single";
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
};
type ToggleGroupMultipleProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleGroupVariants> & {
    type: "multiple";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    required?: never;
};
type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;
declare function ToggleGroup({ className, variant, size, children, type, value: controlledValue, defaultValue, onValueChange, ...props }: ToggleGroupProps): import("react/jsx-runtime").JSX.Element;
declare function ToggleGroupItem({ className, children, variant, size, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleGroupItemVariants>): import("react/jsx-runtime").JSX.Element;
export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants, };
//# sourceMappingURL=toggle-group.d.ts.map
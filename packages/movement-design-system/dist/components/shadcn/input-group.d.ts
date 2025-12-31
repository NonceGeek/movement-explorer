import { VariantProps } from 'class-variance-authority';
import { Button } from './button';
import * as React from "react";
declare function InputGroup({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare const inputGroupAddonVariants: (props?: ({
    align?: "block-end" | "block-start" | "inline-end" | "inline-start" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function InputGroupAddon({ className, align, ...props }: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>): import("react/jsx-runtime").JSX.Element;
declare const inputGroupButtonVariants: (props?: ({
    size?: "xs" | "sm" | "icon-sm" | "icon-xs" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function InputGroupButton({ className, type, variant, size, ...props }: Omit<React.ComponentProps<typeof Button>, "size"> & VariantProps<typeof inputGroupButtonVariants>): import("react/jsx-runtime").JSX.Element;
declare function InputGroupText({ className, ...props }: React.ComponentProps<"span">): import("react/jsx-runtime").JSX.Element;
declare function InputGroupInput({ className, size: _size, ...props }: React.ComponentProps<"input">): import("react/jsx-runtime").JSX.Element;
declare function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">): import("react/jsx-runtime").JSX.Element;
export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea, };
//# sourceMappingURL=input-group.d.ts.map
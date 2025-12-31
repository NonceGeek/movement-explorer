import { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '../shadcn/button';
import * as React from "react";
declare function IconButton({ className, variant, size, asChild, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export { IconButton };
//# sourceMappingURL=IconButton.d.ts.map
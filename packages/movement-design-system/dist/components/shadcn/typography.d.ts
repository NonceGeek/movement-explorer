import { VariantProps } from 'class-variance-authority';
import * as React from "react";
declare const typographyVariants: (props?: ({
    variant?: "blockquote" | "code" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label" | "p" | "small" | "list" | "large" | "uppercase" | "muted" | "lead" | "inlineCode" | "mono" | null | undefined;
    affects?: "default" | "removePMargin" | "removeMargin" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
export interface TypographyProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
    as?: React.ElementType;
    htmlFor?: string;
}
declare const Typography: React.ForwardRefExoticComponent<TypographyProps & React.RefAttributes<HTMLElement>>;
declare const Text: React.ForwardRefExoticComponent<TypographyProps & React.RefAttributes<HTMLElement>>;
export { Typography, Text, typographyVariants };
//# sourceMappingURL=typography.d.ts.map
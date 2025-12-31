import { VariantProps } from 'class-variance-authority';
import * as React from "react";
declare const cardVariants: (props?: ({
    variant?: "default" | "glow" | "iridescent" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
}
declare function Card({ className, variant, children, ...props }: CardProps): import("react/jsx-runtime").JSX.Element;
declare function CardHeader({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardTitle({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardDescription({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardAction({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardContent({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardFooter({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, };
export type { CardProps };
//# sourceMappingURL=card.d.ts.map
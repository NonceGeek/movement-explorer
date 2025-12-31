import { default as React } from 'react';
export type BrandingTheme = "industries" | "labs";
export type BrandingVariant = "lockup-long" | "lockup-short" | "logomark" | "moveus";
export type BrandingColor = "black" | "white" | "color";
export interface BrandingProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /**
     * The branding theme to display
     * @default 'industries'
     */
    theme?: BrandingTheme;
    /**
     * The logo variant to display
     * @default 'logomark'
     */
    variant?: BrandingVariant;
    /**
     * The color version to display
     * @default 'color'
     */
    color?: BrandingColor;
    /**
     * Custom class name
     */
    className?: string;
}
/**
 * Branding component for displaying Movement Labs logos
 */
declare function Branding({ theme, variant, color, className, alt, ...props }: BrandingProps): import("react/jsx-runtime").JSX.Element | null;
export { Branding };
//# sourceMappingURL=Branding.d.ts.map
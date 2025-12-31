/**
 * Gradient Background Recipes
 *
 * CSS classes for gradient backgrounds.
 * The styles are defined in recipes.css and automatically available when the design system is imported.
 *
 * Usage:
 * import { gradientBackgroundClasses } from "@movementlabsxyz/movement-design-system";
 *
 * <div className={gradientBackgroundClasses.mintCyan}>Content</div>
 */
export declare const gradientBackgroundClasses: {
    readonly mintCyan: "gradient-mint-cyan";
    readonly glassOverlay: "gradient-glass-overlay";
};
/**
 * Utility function to get gradient background class names
 *
 * @param variant - The gradient variant to use
 * @returns The CSS class name for the gradient
 */
export declare const getGradientClass: (variant: keyof typeof gradientBackgroundClasses) => "gradient-mint-cyan" | "gradient-glass-overlay";
//# sourceMappingURL=gradient-styles.d.ts.map
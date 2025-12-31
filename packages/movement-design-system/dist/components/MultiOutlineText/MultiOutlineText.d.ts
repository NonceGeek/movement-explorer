import { default as React } from 'react';
interface MultiOutlineTextProps {
    children: React.ReactNode;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: string;
    className?: string;
    waitForFont?: boolean;
    fontFamily?: string;
    outlines?: Array<{
        color: string;
        width: {
            base: string;
            md: string;
        };
    }>;
}
export default function MultiOutlineText({ children, color, fontSize, fontWeight, lineHeight, letterSpacing, textAlign, className, waitForFont, fontFamily, outlines, }: MultiOutlineTextProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=MultiOutlineText.d.ts.map
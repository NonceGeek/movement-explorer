import { VariantProps } from 'class-variance-authority';
import * as React from "react";
/**
 * CryptoAmountInput component - specialized input for crypto amounts
 * Based on Figma Design System - Delegated Staking Amount Input
 *
 * Features:
 * - Large numeric input with mono font
 * - MAX button for setting maximum value
 * - Balance display with wallet icon and token symbol
 * - Error state with insufficient balance badge
 * - Glass effect styling with gradient border
 * - Responsive sizing for mobile and desktop
 */
declare const cryptoAmountInputVariants: (props?: ({
    state?: "default" | "filled" | "disabled" | "error" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
interface CryptoAmountInputProps extends Omit<React.ComponentProps<"input">, "size" | "onChange">, VariantProps<typeof cryptoAmountInputVariants> {
    value?: string;
    onChange?: (value: string) => void;
    balance?: string;
    token?: string;
    onMaxClick?: () => void;
    error?: boolean;
    errorMessage?: string;
    state?: "default" | "filled" | "error" | "disabled";
}
declare const WalletIcon: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, "ref"> & React.RefAttributes<SVGSVGElement>>;
declare const CryptoAmountInput: React.ForwardRefExoticComponent<Omit<CryptoAmountInputProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
export { CryptoAmountInput, WalletIcon };
//# sourceMappingURL=crypto-amount-input.d.ts.map
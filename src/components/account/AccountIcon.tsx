import { User, Box, Coins } from "lucide-react";
import { cn } from "@/utils/styling";

export type AccountType = "account" | "object" | "token";

export interface AccountIconProps {
  type: AccountType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ICON_SIZES = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
} as const;

const ICON_COMPONENT_SIZES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

const GRADIENTS = {
  account: "bg-gradient-to-br from-guild-green-500 to-guild-green-600",
  object: "bg-gradient-to-br from-byzantine-blue-500 to-byzantine-blue-600",
  token: "bg-gradient-to-br from-moveus-marigold-500 to-moveus-marigold-600",
} as const;

export function AccountIcon({
  type,
  size = "md",
  className,
}: AccountIconProps) {
  const IconComponent = type === "account"
    ? User
    : type === "object"
      ? Box
      : Coins;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shadow-md",
        ICON_SIZES[size],
        GRADIENTS[type],
        className
      )}
    >
      <IconComponent
        className={cn(
          "text-white",
          ICON_COMPONENT_SIZES[size]
        )}
      />
    </div>
  );
}

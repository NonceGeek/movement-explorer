import Avatar from "boring-avatars";
import { Box, Coins } from "lucide-react";
import { cn } from "@/utils/styling";

export type AccountType = "account" | "object" | "token";

export interface AccountIconProps {
  type: AccountType;
  address?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AVATAR_SIZES = {
  sm: 40,
  md: 48,
  lg: 64,
} as const;

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
  object: "bg-gradient-to-br from-byzantine-blue-500 to-byzantine-blue-600",
  token: "bg-gradient-to-br from-moveus-marigold-500 to-moveus-marigold-600",
} as const;

const AVATAR_COLORS = [
  "#6ce2a1", // guild-green-400
  "#0337ff", // byzantine-blue-400
  "#ffd935", // moveus-marigold-400
  "#eb66cf", // protocol-pink-400
  "#FF6642", // oracle-orange-400
];

export function AccountIcon({
  type,
  address,
  size = "md",
  className,
}: AccountIconProps) {
  if (type === "account" && address) {
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden shadow-md",
          ICON_SIZES[size],
          className,
        )}
      >
        <Avatar
          name={address}
          size={AVATAR_SIZES[size]}
          variant="pixel"
          colors={AVATAR_COLORS}
        />
      </div>
    );
  }

  const IconComponent = type === "object" ? Box : Coins;
  const gradient =
    type === "account" ? "bg-gray-100 dark:bg-gray-800" : GRADIENTS[type];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shadow-md",
        ICON_SIZES[size],
        gradient,
        className,
      )}
    >
      <IconComponent className={cn("text-white", ICON_COMPONENT_SIZES[size])} />
    </div>
  );
}

import Avatar from "boring-avatars";
import { cn } from "@/utils/styling";

export type AccountType = "account" | "object" | "token";

export interface AccountIconProps {
  type: AccountType;
  address?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
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

const AVATAR_COLORS: Record<AccountType, string[]> = {
  account: [
    "#6ce2a1", // guild-green-400
    "#0337ff", // byzantine-blue-400
    "#ffd935", // moveus-marigold-400
    "#eb66cf", // protocol-pink-400
    "#FF6642", // oracle-orange-400
  ],
  object: [
    "#0337ff", // byzantine-blue-400
    "#7c3aed", // violet-600
    "#6366f1", // indigo-500
    "#3b82f6", // blue-500
    "#06b6d4", // cyan-500
  ],
  token: [
    "#ffd935", // moveus-marigold-400
    "#FF6642", // oracle-orange-400
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#eb66cf", // protocol-pink-400
  ],
};

export function AccountIcon({
  type,
  address,
  size = "md",
  shape = "circle",
  className,
}: AccountIconProps) {
  return (
    <div
      className={cn(
        "overflow-hidden shadow-md",
        shape === "circle" ? "rounded-full" : "rounded-lg",
        ICON_SIZES[size],
        className,
      )}
    >
      <Avatar
        name={address || "unknown"}
        size={AVATAR_SIZES[size]}
        variant="pixel"
        colors={AVATAR_COLORS[type]}
      />
    </div>
  );
}

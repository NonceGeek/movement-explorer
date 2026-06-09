"use client";

import { useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/utils/styling";

type TokenIconProps = {
  src?: string | null;
  symbol?: string | null;
  alt?: string;
  className?: string;
  textClassName?: string;
};

const FALLBACK_COLORS = [
  { bg: "#e0f2fe", fg: "#075985", border: "#bae6fd" },
  { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0" },
  { bg: "#fae8ff", fg: "#86198f", border: "#f5d0fe" },
  { bg: "#ffedd5", fg: "#9a3412", border: "#fed7aa" },
  { bg: "#ede9fe", fg: "#5b21b6", border: "#ddd6fe" },
  { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
];

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getInitials(value?: string | null): string {
  if (!value) return "";
  const primary = value.split(" - ")[1] || value.split(" - ")[0] || value;
  const clean = primary
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  if (!clean) return "";

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return clean.slice(0, 2).toUpperCase();
}

export function TokenIcon({
  src,
  symbol,
  alt,
  className,
  textClassName,
}: TokenIconProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getInitials(symbol);
  const colors = useMemo(() => {
    const key = symbol || alt || "";
    return FALLBACK_COLORS[hashText(key) % FALLBACK_COLORS.length];
  }, [alt, symbol]);

  const baseClassName = cn(
    "shrink-0 rounded-full object-cover",
    className ?? "h-6 w-6",
  );

  if (src && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || symbol || "Token"}
        className={baseClassName}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      aria-label={alt || symbol || "Token"}
      className={cn(
        "inline-flex items-center justify-center border font-semibold leading-none",
        baseClassName,
        "text-[9px] sm:text-[10px]",
        textClassName,
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.fg,
      }}
    >
      {initials ? (
        <span className="max-w-full overflow-hidden px-px text-center">
          {initials}
        </span>
      ) : (
        <Coins className="h-3/5 w-3/5" />
      )}
    </span>
  );
}

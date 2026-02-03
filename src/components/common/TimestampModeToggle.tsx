"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/styling";

interface TimestampModeToggleProps {
  mode: "age" | "dateTime";
  setMode: (mode: "age" | "dateTime") => void;
  className?: string;
}

export function TimestampModeToggle({
  mode,
  setMode,
  className,
}: TimestampModeToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center bg-muted/30 rounded-md p-0.5 border border-border/50 relative",
        className,
      )}
    >
      <button
        onClick={() => setMode("age")}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded relative z-10 transition-colors duration-200 cursor-pointer",
          mode === "age"
            ? "text-black"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Age
      </button>
      <button
        onClick={() => setMode("dateTime")}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded relative z-10 transition-colors duration-200 cursor-pointer",
          mode === "dateTime"
            ? "text-black"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        UTC
      </button>
      <div className="absolute inset-0.5 pointer-events-none">
        <motion.div
          className="h-full bg-guild-green-500 rounded shadow-sm"
          initial={false}
          animate={{
            x: mode === "age" ? 0 : "100%",
            width: "50%",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      </div>
    </div>
  );
}

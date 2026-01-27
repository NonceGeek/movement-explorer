"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatAge, formatDateTimeUTC } from "@/utils/time";

interface TimestampToggleProps {
  timestamp: string | number | null | undefined;
  timestampMode: "age" | "dateTime";
  onToggle?: () => void;
}

export function TimestampToggle({
  timestamp,
  timestampMode,
  onToggle,
}: TimestampToggleProps) {
  return (
    <div
      className="cursor-pointer hover:text-foreground/80 hover:bg-muted/50 px-2 py-1 rounded transition-colors inline-block"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      title="Click to toggle format"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={timestampMode}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.15 }}
        >
          {timestamp
            ? timestampMode === "age"
              ? formatAge(timestamp.toString())
              : formatDateTimeUTC(timestamp.toString())
            : "-"}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

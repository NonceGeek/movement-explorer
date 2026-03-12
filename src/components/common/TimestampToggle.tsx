"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatAge, formatDateTimeLocal, formatDateTimeUTC } from "@/utils/time";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const tooltipText = timestamp
    ? timestampMode === "age"
      ? formatDateTimeLocal(timestamp.toString())
      : formatAge(timestamp.toString())
    : undefined;

  const content = (
    <div
      className="cursor-pointer hover:text-foreground/80 hover:bg-muted/50 py-1 rounded transition-colors inline-block"
      onClick={onToggle}
      role="button"
      tabIndex={0}
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

  if (!tooltipText) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

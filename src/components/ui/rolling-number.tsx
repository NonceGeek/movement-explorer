"use client";

import { useSpring, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

export interface RollingNumberProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}

export function RollingNumber({
  value,
  duration = 1.5,
  className,
  format = (v) => Math.round(v).toLocaleString(),
}: RollingNumberProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => format(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}

import { formatAge, formatDateTimeUTC } from "@/utils/time";

interface TimestampAgeProps {
  timestamp: string;
  className?: string;
}

export function TimestampAge({ timestamp, className }: TimestampAgeProps) {
  return (
    <span className={className}>
      {formatAge(timestamp)}
      <span className="text-muted-foreground ml-2">
        ({formatDateTimeUTC(timestamp)})
      </span>
    </span>
  );
}

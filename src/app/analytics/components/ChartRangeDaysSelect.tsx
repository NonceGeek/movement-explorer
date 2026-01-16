"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export enum ChartRangeDays {
  DEFAULT_RANGE = 7,
  FULL_RANGE = 30,
}

type ChartRangeDaysSelectProps = {
  days: ChartRangeDays;
  setDays: (days: ChartRangeDays) => void;
};

export default function ChartRangeDaysSelect({
  days,
  setDays,
}: ChartRangeDaysSelectProps) {
  return (
    <Select
      value={days.toString()}
      onValueChange={(value) => setDays(parseInt(value))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ChartRangeDays.DEFAULT_RANGE.toString()}>
          Last 7 Days
        </SelectItem>
        <SelectItem value={ChartRangeDays.FULL_RANGE.toString()}>
          Last 30 Days
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

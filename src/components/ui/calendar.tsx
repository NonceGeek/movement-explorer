"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/utils/styling";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month:
          "grid grid-cols-[auto_1fr_auto] items-center gap-y-4",
        month_caption: "col-start-2 text-center",
        caption_label: "text-sm font-medium",
        button_previous: cn(
          "col-start-1 h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent p-0",
          "text-muted-foreground hover:opacity-100 hover:bg-accent transition-colors cursor-pointer",
        ),
        button_next: cn(
          "col-start-3 h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent p-0",
          "text-muted-foreground hover:opacity-100 hover:bg-accent transition-colors cursor-pointer",
        ),
        month_grid: "col-span-full w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day_button: cn(
          "h-8 w-8 p-0 font-normal inline-flex items-center justify-center rounded-md text-sm transition-colors cursor-pointer",
          "hover:bg-accent hover:text-accent-foreground",
          "aria-selected:opacity-100",
        ),
        range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "day-outside text-muted-foreground/40",
        disabled: "text-muted-foreground/30 cursor-not-allowed",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };

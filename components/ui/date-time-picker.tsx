"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  showTime?: boolean;
  className?: string;
}

const TIME_SLOTS = [
  "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM",
];

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  showTime = false,
  className,
}: DateTimePickerProps) {
  const [time, setTime] = useState<string>("9:00 AM");

  const handleDateSelect = (date: Date | undefined) => {
    if (date && showTime) {
      const [rawTime, period] = time.split(" ");
      const [hours, minutes] = rawTime.split(":").map(Number);
      let h = hours;
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      date.setHours(h, minutes, 0, 0);
    }
    onChange(date);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (value) {
      const newDate = new Date(value);
      const [rawTime, period] = newTime.split(" ");
      const [hours, minutes] = rawTime.split(":").map(Number);
      let h = hours;
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      newDate.setHours(h, minutes, 0, 0);
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover>
        <PopoverTrigger
          className={cn(
            "inline-flex items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent hover:text-accent-foreground flex-1 text-left",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => (minDate ? date < minDate : false)}
          />
        </PopoverContent>
      </Popover>

      {showTime && (
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={time}
            onChange={handleTimeChange}
            className="h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer w-[140px]"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

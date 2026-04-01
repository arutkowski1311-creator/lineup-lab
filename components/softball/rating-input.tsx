"use client";

import { cn } from "@/lib/utils";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function RatingInput({ value, onChange, label }: RatingInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex items-center justify-center rounded-lg text-sm font-bold min-w-[44px] min-h-[44px] transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                  : "border border-input bg-background text-foreground hover:bg-muted"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

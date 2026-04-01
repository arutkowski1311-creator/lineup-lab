"use client";

import { cn } from "@/lib/utils";
import type { Position } from "@/lib/types";

const INFIELD_ROW: Position[] = ["P", "C", "1B", "2B", "SS", "3B"];
const OUTFIELD_ROW: Position[] = ["LF", "LC", "RC", "RF"];

interface PositionPickerProps {
  value: Position | null;
  onChange: (position: Position) => void;
  availablePositions?: Position[];
}

export function PositionPicker({
  value,
  onChange,
  availablePositions,
}: PositionPickerProps) {
  function renderButton(pos: Position) {
    const isAvailable = !availablePositions || availablePositions.includes(pos);
    const isSelected = value === pos;

    return (
      <button
        key={pos}
        type="button"
        disabled={!isAvailable}
        onClick={() => onChange(pos)}
        className={cn(
          "flex items-center justify-center rounded-lg text-sm font-bold min-w-[44px] min-h-[44px] transition-all",
          isSelected
            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
            : isAvailable
              ? "border border-input bg-background text-foreground hover:bg-muted"
              : "border border-input bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed"
        )}
      >
        {pos}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap justify-center">
        {INFIELD_ROW.map(renderButton)}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {OUTFIELD_ROW.map(renderButton)}
      </div>
    </div>
  );
}

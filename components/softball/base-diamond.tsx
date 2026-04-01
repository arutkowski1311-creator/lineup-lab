"use client";

import { cn } from "@/lib/utils";

interface BaseDiamondProps {
  runners: { first: boolean; second: boolean; third: boolean };
  size?: "sm" | "lg";
}

export function BaseDiamond({ runners, size = "sm" }: BaseDiamondProps) {
  const containerSize = size === "lg" ? "w-[120px] h-[120px]" : "w-[80px] h-[80px]";
  const baseSize = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  const homeSize = size === "lg" ? "w-4 h-4" : "w-3 h-3";

  return (
    <div className={cn("relative", containerSize)}>
      {/* Second base - top center */}
      <div
        className={cn(
          "absolute left-1/2 top-0 -translate-x-1/2 rotate-45 border-2 transition-colors",
          baseSize,
          runners.second
            ? "bg-yellow-400 border-yellow-500"
            : "bg-transparent border-muted-foreground/40"
        )}
      />

      {/* Third base - middle left */}
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 rotate-45 border-2 transition-colors",
          baseSize,
          runners.third
            ? "bg-yellow-400 border-yellow-500"
            : "bg-transparent border-muted-foreground/40"
        )}
      />

      {/* First base - middle right */}
      <div
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 rotate-45 border-2 transition-colors",
          baseSize,
          runners.first
            ? "bg-yellow-400 border-yellow-500"
            : "bg-transparent border-muted-foreground/40"
        )}
      />

      {/* Home plate - bottom center */}
      <div
        className={cn(
          "absolute left-1/2 bottom-0 -translate-x-1/2 rotate-45 border-2 bg-white border-muted-foreground/60",
          homeSize
        )}
      />

      {/* Diamond lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 8 L92 50 L50 92 L8 50 Z"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/20"
          fill="none"
        />
      </svg>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

interface ScoreByInning {
  inningNumber: number;
  usRuns: number;
  opponentRuns: number;
}

interface ScoreDisplayProps {
  scoreByInning: ScoreByInning[];
  teamName?: string;
  opponentName?: string;
  currentInning?: number;
}

export function ScoreDisplay({
  scoreByInning,
  teamName = "Us",
  opponentName = "Opp",
  currentInning,
}: ScoreDisplayProps) {
  const innings = scoreByInning.length > 0
    ? scoreByInning
    : Array.from({ length: 6 }, (_, i) => ({
        inningNumber: i + 1,
        usRuns: 0,
        opponentRuns: 0,
      }));

  const totalUs = innings.reduce((sum, i) => sum + i.usRuns, 0);
  const totalOpp = innings.reduce((sum, i) => sum + i.opponentRuns, 0);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[320px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-16" />
            {innings.map((inn) => (
              <th
                key={inn.inningNumber}
                className={cn(
                  "px-2 py-1.5 text-center font-medium min-w-[32px]",
                  currentInning === inn.inningNumber
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                )}
              >
                {inn.inningNumber}
              </th>
            ))}
            <th className="px-2 py-1.5 text-center font-bold">R</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border/50">
            <td className="px-2 py-1.5 font-medium text-xs truncate max-w-[64px]">
              {teamName}
            </td>
            {innings.map((inn) => (
              <td
                key={inn.inningNumber}
                className={cn(
                  "px-2 py-1.5 text-center",
                  currentInning === inn.inningNumber && "bg-primary/5 font-bold"
                )}
              >
                {inn.usRuns}
              </td>
            ))}
            <td className="px-2 py-1.5 text-center font-bold">{totalUs}</td>
          </tr>
          <tr className="border-t border-border/50">
            <td className="px-2 py-1.5 font-medium text-xs truncate max-w-[64px]">
              {opponentName}
            </td>
            {innings.map((inn) => (
              <td
                key={inn.inningNumber}
                className={cn(
                  "px-2 py-1.5 text-center",
                  currentInning === inn.inningNumber && "bg-primary/5 font-bold"
                )}
              >
                {inn.opponentRuns}
              </td>
            ))}
            <td className="px-2 py-1.5 text-center font-bold">{totalOpp}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

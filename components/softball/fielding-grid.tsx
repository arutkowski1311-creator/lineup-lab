"use client";

import { cn } from "@/lib/utils";
import { POSITIONS, INNINGS } from "@/lib/types";
import type { Position } from "@/lib/types";
import { Lock } from "lucide-react";

interface FieldingAssignment {
  inningNumber: number;
  position: string;
  playerId: string;
  assignmentType: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface FieldingGridProps {
  assignments: FieldingAssignment[];
  players: Player[];
  onCellClick?: (inning: number, position: Position) => void;
  lockedCells?: Set<string>;
}

export function FieldingGrid({
  assignments,
  players,
  onCellClick,
  lockedCells,
}: FieldingGridProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  function getAssignment(inning: number, position: Position) {
    return assignments.find(
      (a) => a.inningNumber === inning && a.position === position
    );
  }

  function getCellKey(inning: number, position: Position) {
    return `${inning}-${position}`;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background px-2 py-2 text-left font-medium text-muted-foreground w-12">
              Pos
            </th>
            {INNINGS.map((inning) => (
              <th
                key={inning}
                className="px-1 py-2 text-center font-medium text-muted-foreground min-w-[60px]"
              >
                {inning}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POSITIONS.map((position) => (
            <tr key={position} className="border-t border-border/50">
              <td className="sticky left-0 z-10 bg-background px-2 py-1 font-bold text-xs">
                {position}
              </td>
              {INNINGS.map((inning) => {
                const assignment = getAssignment(inning, position);
                const player = assignment
                  ? playerMap.get(assignment.playerId)
                  : null;
                const cellKey = getCellKey(inning, position);
                const isLocked = lockedCells?.has(cellKey);

                return (
                  <td key={inning} className="px-0.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => onCellClick?.(inning, position)}
                      disabled={!onCellClick}
                      className={cn(
                        "flex items-center justify-center gap-0.5 w-full rounded px-1 py-1.5 text-xs font-medium transition-colors min-h-[32px]",
                        isLocked
                          ? "bg-muted/80 text-muted-foreground cursor-default"
                          : player
                            ? "bg-primary/10 text-foreground hover:bg-primary/20 active:bg-primary/30"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      {isLocked && <Lock className="size-3 shrink-0" />}
                      <span className="truncate">
                        {player ? player.firstName : "-"}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

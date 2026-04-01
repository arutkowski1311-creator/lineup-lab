"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { PlayerData, CoachMode } from "@/lib/types";
import { playerFullName } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COACH_MODES: { value: CoachMode; title: string; description: string }[] = [
  {
    value: "fairness",
    title: "Fairness First",
    description: "Prioritize equal playing time and position variety for all players.",
  },
  {
    value: "balanced",
    title: "Balanced",
    description: "Mix of fairness and competitive positioning. Good for most games.",
  },
  {
    value: "win-now",
    title: "Win Now",
    description: "Put your strongest players in key positions. For tournament play.",
  },
];

export default function NewGamePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [opponentName, setOpponentName] = useState("");
  const [gameDate, setGameDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [coachMode, setCoachMode] = useState<CoachMode>("balanced");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data: PlayerData[]) => {
        setPlayers(data);
        setSelectedPlayerIds(new Set(data.map((p) => p.id)));
      })
      .catch(() => toast.error("Failed to load players"))
      .finally(() => setLoading(false));
  }, []);

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedPlayerIds(new Set(players.map((p) => p.id)));
  }

  async function handleSubmit() {
    if (!opponentName.trim()) {
      toast.error("Opponent name is required");
      return;
    }
    if (selectedPlayerIds.size < 10) {
      toast.error("Select at least 10 players");
      return;
    }

    setSubmitting(true);
    try {
      const playerIds = Array.from(selectedPlayerIds);

      // Create game
      const createRes = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentName,
          gameDate,
          coachMode,
          notes: notes || null,
          playerIds,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create game");
      }
      const game = await createRes.json();

      // Generate lineup
      const genRes = await fetch(`/api/games/${game.id}/lineup/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds, coachMode }),
      });
      if (!genRes.ok) {
        throw new Error("Failed to generate lineup");
      }
      const lineup = await genRes.json();

      // Save lineup
      await fetch(`/api/games/${game.id}/lineup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battingOrder: lineup.battingOrder,
          fieldingAssignments: lineup.fieldingAssignments,
        }),
      });

      toast.success("Game created with lineup!");
      router.push(`/games/${game.id}/lineup`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/games")}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">New Game</h1>
      </header>

      {/* Opponent */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Opponent Name *</label>
        <Input
          value={opponentName}
          onChange={(e) => setOpponentName(e.target.value)}
          placeholder="e.g. Thunder Bolts"
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Game Date</label>
        <Input
          type="date"
          value={gameDate}
          onChange={(e) => setGameDate(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Location, time, etc."
          className="min-h-[60px]"
        />
      </div>

      {/* Coach Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Coach Mode</label>
        <div className="grid gap-2">
          {COACH_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setCoachMode(mode.value)}
              className={cn(
                "flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-colors",
                coachMode === mode.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <p className="font-semibold">{mode.title}</p>
              <p className="text-sm text-muted-foreground">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Player Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Players ({selectedPlayerIds.size} selected)
          </label>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
        </div>
        <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto rounded-lg border p-2">
          {players.map((player) => {
            const isSelected = selectedPlayerIds.has(player.id);
            const avg =
              (player.fieldingOverall +
                player.catching +
                player.throwing +
                player.battingOverall) /
              4;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  isSelected
                    ? "bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                {isSelected ? (
                  <CheckSquare className="size-5 text-primary shrink-0" />
                ) : (
                  <Square className="size-5 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 font-medium truncate">
                  {playerFullName(player.firstName, player.lastName)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Avg {avg.toFixed(1)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || !opponentName.trim() || selectedPlayerIds.size < 10}
        className="w-full h-12 text-base"
      >
        {submitting ? "Creating..." : "Create Game & Generate Lineup"}
      </Button>
    </div>
  );
}

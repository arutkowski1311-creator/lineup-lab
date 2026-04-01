"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScoreDisplay } from "@/components/softball/score-display";
import { OutTracker } from "@/components/softball/out-tracker";
import { cn } from "@/lib/utils";
import type { GameData, ScoreByInning } from "@/lib/types";

interface LiveState {
  currentInning: number;
  currentHalf: string;
  currentOuts: number;
  gameStatus: string;
  scoreByInning: ScoreByInning[];
}

export default function LiveGamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGame(data);
      setLiveState({
        currentInning: data.currentInning,
        currentHalf: data.currentHalf,
        currentOuts: data.currentOuts,
        gameStatus: data.gameStatus,
        scoreByInning: data.scoreByInning || [],
      });
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
    pollRef.current = setInterval(fetchGame, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchGame]);

  // Start game if scheduled
  const gameStatus = game?.gameStatus;
  useEffect(() => {
    if (gameStatus === "scheduled") {
      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameStatus: "live" }),
      }).then(() => fetchGame());
    }
  }, [gameStatus, gameId, fetchGame]);

  async function doAction(action: string) {
    setActing(true);
    try {
      const res = await fetch(`/api/games/${gameId}/live`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        // If live endpoint doesn't exist, fall back to manual updates
        await handleFallbackAction(action);
      } else {
        const data = await res.json();
        setLiveState(data);
        setGame((prev) => prev ? { ...prev, ...data } : prev);

        // Check for auto-advance on 3 outs
        if (
          (action === "add_out") &&
          data.currentOuts === 0 &&
          liveState &&
          liveState.currentOuts === 2
        ) {
          toast.info("3 outs! Side retired.");
        }
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActing(false);
    }
  }

  async function handleFallbackAction(action: string) {
    if (!game || !liveState) return;

    let updates: Record<string, unknown> = {};
    const scoreByInning = [...(liveState.scoreByInning || [])];

    // Find or create current inning score
    let currentScore = scoreByInning.find(
      (s) => s.inningNumber === liveState.currentInning
    );
    if (!currentScore) {
      currentScore = {
        inningNumber: liveState.currentInning,
        half: liveState.currentHalf as "top" | "bottom",
        usRuns: 0,
        opponentRuns: 0,
        outsRecorded: 0,
        completed: false,
      };
      scoreByInning.push(currentScore);
    }

    switch (action) {
      case "add_out": {
        const newOuts = liveState.currentOuts + 1;
        if (newOuts >= 3) {
          // Auto-advance: switch half or inning
          if (liveState.currentHalf === "top") {
            updates = { currentOuts: 0, currentHalf: "bottom" };
          } else {
            updates = {
              currentOuts: 0,
              currentHalf: "top",
              currentInning: liveState.currentInning + 1,
            };
          }
          toast.info("3 outs! Side retired.");
        } else {
          updates = { currentOuts: newOuts };
        }
        break;
      }
      case "undo_out":
        updates = { currentOuts: Math.max(0, liveState.currentOuts - 1) };
        break;
      case "add_run_us":
        currentScore.usRuns++;
        break;
      case "sub_run_us":
        currentScore.usRuns = Math.max(0, currentScore.usRuns - 1);
        break;
      case "add_run_opp":
        currentScore.opponentRuns++;
        break;
      case "sub_run_opp":
        currentScore.opponentRuns = Math.max(0, currentScore.opponentRuns - 1);
        break;
    }

    const res = await fetch(`/api/games/${gameId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await fetchGame();
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      // Try finalize endpoint
      let res = await fetch(`/api/games/${gameId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // Fallback: just set status to final
        const totalUs = (liveState?.scoreByInning || []).reduce(
          (sum, s) => sum + s.usRuns,
          0
        );
        const totalOpp = (liveState?.scoreByInning || []).reduce(
          (sum, s) => sum + s.opponentRuns,
          0
        );
        res = await fetch(`/api/games/${gameId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameStatus: "final",
            finalTeamScore: totalUs,
            finalOpponentScore: totalOpp,
          }),
        });
      }

      toast.success("Game finalized!");
      setFinalizeOpen(false);
      router.push("/games");
    } catch {
      toast.error("Failed to finalize game");
    } finally {
      setFinalizing(false);
    }
  }

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const scoreInnings = (liveState?.scoreByInning || []).map((s) => ({
    inningNumber: s.inningNumber,
    usRuns: s.usRuns,
    opponentRuns: s.opponentRuns,
  }));

  const totalUs = scoreInnings.reduce((sum, s) => sum + s.usRuns, 0);
  const totalOpp = scoreInnings.reduce((sum, s) => sum + s.opponentRuns, 0);

  const currentInning = liveState?.currentInning || 1;
  const currentHalf = liveState?.currentHalf || "top";
  const currentOuts = liveState?.currentOuts || 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="no-print flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/games/${gameId}/lineup`)}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">
          vs {game.opponentName}
        </h1>
        <Badge variant="default">
          {currentHalf === "top" ? "Top" : "Bot"} {currentInning}
        </Badge>
      </div>

      {/* Score Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Us</p>
            <p className="text-5xl font-bold tabular-nums">{totalUs}</p>
          </div>
          <span className="text-2xl text-muted-foreground font-light">-</span>
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">
              {game.opponentName}
            </p>
            <p className="text-5xl font-bold tabular-nums">{totalOpp}</p>
          </div>
        </div>

        {/* Outs */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">Outs:</span>
          <OutTracker outs={currentOuts} size="lg" />
        </div>
      </div>

      {/* Action Buttons - 2x3 Grid */}
      <div className="grid grid-cols-2 gap-3 py-4">
        <button
          type="button"
          onClick={() => doAction("add_out")}
          disabled={acting}
          className="flex items-center justify-center rounded-xl bg-red-500 text-white font-bold text-lg min-h-[56px] h-16 active:bg-red-600 transition-colors disabled:opacity-50"
        >
          OUT
        </button>
        <button
          type="button"
          onClick={() => doAction("undo_out")}
          disabled={acting || currentOuts === 0}
          className="flex items-center justify-center rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm min-h-[56px] h-16 active:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Undo Out
        </button>
        <button
          type="button"
          onClick={() => doAction("add_run_us")}
          disabled={acting}
          className="flex items-center justify-center rounded-xl bg-green-500 text-white font-bold text-base min-h-[56px] h-16 active:bg-green-600 transition-colors disabled:opacity-50"
        >
          + Run Us
        </button>
        <button
          type="button"
          onClick={() => doAction("sub_run_us")}
          disabled={acting}
          className="flex items-center justify-center rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm min-h-[56px] h-16 active:bg-gray-300 transition-colors disabled:opacity-50"
        >
          - Run Us
        </button>
        <button
          type="button"
          onClick={() => doAction("add_run_opp")}
          disabled={acting}
          className="flex items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-base min-h-[56px] h-16 active:bg-blue-600 transition-colors disabled:opacity-50"
        >
          + Run Opp
        </button>
        <button
          type="button"
          onClick={() => doAction("sub_run_opp")}
          disabled={acting}
          className="flex items-center justify-center rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm min-h-[56px] h-16 active:bg-gray-300 transition-colors disabled:opacity-50"
        >
          - Run Opp
        </button>
      </div>

      {/* Inning-by-inning scores */}
      <ScoreDisplay
        scoreByInning={scoreInnings}
        teamName="Us"
        opponentName={game.opponentName}
        currentInning={currentInning}
      />

      {/* Finalize */}
      <Button
        variant="outline"
        onClick={() => setFinalizeOpen(true)}
        className="w-full h-12 mt-2"
      >
        <Flag className="size-4 mr-2" />
        Finalize Game
      </Button>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Game?</DialogTitle>
            <DialogDescription>
              This will end the game and record the final score as {totalUs}-{totalOpp}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? "Finalizing..." : "Finalize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

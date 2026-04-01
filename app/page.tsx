"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, PlusCircle, Calendar, PlayCircle, LogIn } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GameData } from "@/lib/types";

export default function DashboardPage() {
  const [activeGame, setActiveGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401) {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));

    fetch("/api/games")
      .then((res) => res.json())
      .then((games: GameData[]) => {
        const live = games.find((g) => g.gameStatus === "live");
        setActiveGame(live ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary flex items-center justify-center">
          <PlayCircle className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Lineup Lab</h1>
      </header>

      {!isLoggedIn && (
        <Link href="/auth/login">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-2">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <LogIn className="size-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Sign In</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to save your teams and game data
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {!loading && activeGame && (
        <Link href={`/games/${activeGame.id}/hub`}>
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-green-500" />
                </span>
                Live Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">vs {activeGame.opponentName}</p>
              <p className="text-sm text-muted-foreground">
                Inning {activeGame.currentInning} &middot; Tap to continue
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid gap-4">
        <Link href="/roster">
          <Card className="transition-shadow hover:shadow-md active:shadow-sm">
            <CardContent className="flex items-center gap-4 py-2">
              <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users className="size-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Manage Roster</p>
                <p className="text-sm text-muted-foreground">
                  Add players, set ratings
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/games/new">
          <Card className="transition-shadow hover:shadow-md active:shadow-sm">
            <CardContent className="flex items-center gap-4 py-2">
              <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <PlusCircle className="size-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">New Game</p>
                <p className="text-sm text-muted-foreground">
                  Create a game and generate lineups
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/games">
          <Card className="transition-shadow hover:shadow-md active:shadow-sm">
            <CardContent className="flex items-center gap-4 py-2">
              <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Calendar className="size-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Game History</p>
                <p className="text-sm text-muted-foreground">
                  View past and upcoming games
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

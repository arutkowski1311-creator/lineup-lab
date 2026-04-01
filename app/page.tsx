"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  PlusCircle,
  Calendar,
  PlayCircle,
  LogIn,
  UserPlus,
  Swords,
  Trophy,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GameData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const [games, setGames] = useState<GameData[]>([]);
  const [activeGame, setActiveGame] = useState<GameData | null>(null);
  const [upcomingGame, setUpcomingGame] = useState<GameData | null>(null);
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
      .then((data: GameData[]) => {
        setGames(data);
        const live = data.find((g) => g.gameStatus === "live");
        setActiveGame(live ?? null);
        if (!live) {
          const scheduled = data
            .filter((g) => g.gameStatus === "scheduled")
            .sort(
              (a, b) =>
                new Date(a.gameDate).getTime() -
                new Date(b.gameDate).getTime()
            );
          setUpcomingGame(scheduled[0] ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const finishedGames = games.filter((g) => g.gameStatus === "final");
  const wins = finishedGames.filter(
    (g) =>
      g.finalTeamScore !== null &&
      g.finalOpponentScore !== null &&
      g.finalTeamScore > g.finalOpponentScore
  ).length;
  const losses = finishedGames.filter(
    (g) =>
      g.finalTeamScore !== null &&
      g.finalOpponentScore !== null &&
      g.finalTeamScore < g.finalOpponentScore
  ).length;

  const heroGame = activeGame ?? upcomingGame;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto min-h-screen">
      {/* ── Header ── */}
      <header className="flex items-center gap-4 pt-2">
        <div className="relative size-12 rounded-xl bg-cardinal-gradient flex items-center justify-center shadow-lg shadow-cardinal/30">
          <Swords className="size-6 text-gold" />
          <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-gold led-glow" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gold-gradient leading-none">
            LINEUP LAB
          </h1>
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            USC Youth Softball
          </p>
        </div>
      </header>

      {/* ── Sign-in prompt ── */}
      {!isLoggedIn && (
        <Link href="/auth/login">
          <Card className="border-gold/30 bg-gold/5 card-glow transition-all hover:border-gold/50">
            <CardContent className="flex items-center gap-4 py-3">
              <div className="size-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <LogIn className="size-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gold">Sign In</p>
                <p className="text-sm text-muted-foreground">
                  Save your teams, games, and lineups
                </p>
              </div>
              <ChevronRight className="size-5 text-gold/50 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* ── Next Game / Live Game Hero Card ── */}
      {!loading && heroGame && (
        <Link href={activeGame ? `/games/${activeGame.id}/hub` : `/games/${heroGame.id}/hub`}>
          <div className="scoreboard-panel rounded-2xl p-[2px] bg-gradient-to-br from-gold/40 via-cardinal/30 to-gold/20">
            <div className="rounded-[14px] bg-background/95 backdrop-blur p-5 space-y-4">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                {activeGame ? (
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-400">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
                    </span>
                    Live Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
                    <Zap className="size-3.5" />
                    Next Game
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  {new Date(heroGame.gameDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Matchup */}
              <div className="text-center space-y-1">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
                  {heroGame.homeOrAway === "away" ? "@ " : "vs "}
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {heroGame.opponentName}
                </p>
                {activeGame && (
                  <p className="text-sm text-muted-foreground">
                    Inning {activeGame.currentInning} &middot;{" "}
                    {activeGame.currentHalf === "top" ? "Top" : "Bottom"}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                className={cn(
                  "w-full h-12 text-base font-bold tracking-wide rounded-xl shadow-lg",
                  activeGame
                    ? "bg-green-600 hover:bg-green-500 text-white shadow-green-600/30"
                    : "bg-gold hover:bg-gold/90 text-background shadow-gold/30"
                )}
              >
                {activeGame ? (
                  <>
                    <PlayCircle className="size-5 mr-2" />
                    Continue Game
                  </>
                ) : (
                  <>
                    <PlayCircle className="size-5 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            </div>
          </div>
        </Link>
      )}

      {/* ── Quick Action Grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* New Game */}
        <Link href="/games/new" className="group">
          <Card className="bg-cardinal-gradient border-0 card-glow transition-all h-full hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="size-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <PlusCircle className="size-6 text-gold" />
              </div>
              <span className="font-bold text-white text-sm tracking-wide">
                New Game
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* Roster */}
        <Link href="/roster" className="group">
          <Card className="border-gold/20 bg-card card-glow transition-all h-full hover:scale-[1.02] hover:border-gold/40 active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <Users className="size-6 text-gold" />
              </div>
              <span className="font-bold text-foreground text-sm tracking-wide">
                Roster
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* Game History */}
        <Link href="/games" className="group">
          <Card className="border-border/50 bg-card card-glow transition-all h-full hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="size-12 rounded-full bg-cardinal/10 flex items-center justify-center group-hover:bg-cardinal/20 transition-colors">
                <Calendar className="size-6 text-cardinal-bright" />
              </div>
              <span className="font-bold text-foreground text-sm tracking-wide">
                Game History
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* Invite People (logged in only) */}
        {isLoggedIn ? (
          <Link href="/team/invites" className="group">
            <Card className="border-border/50 bg-card card-glow transition-all h-full hover:scale-[1.02] active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
                <div className="size-12 rounded-full bg-cardinal/10 flex items-center justify-center group-hover:bg-cardinal/20 transition-colors">
                  <UserPlus className="size-6 text-cardinal-bright" />
                </div>
                <span className="font-bold text-foreground text-sm tracking-wide">
                  Invite People
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/auth/login" className="group">
            <Card className="border-border/50 bg-card card-glow transition-all h-full hover:scale-[1.02] active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
                <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <LogIn className="size-6 text-gold-dim" />
                </div>
                <span className="font-bold text-foreground text-sm tracking-wide">
                  Sign In
                </span>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* ── Team Record ── */}
      {finishedGames.length > 0 && (
        <div className="scoreboard-panel rounded-2xl p-[2px] bg-gradient-to-r from-cardinal/30 via-gold/20 to-cardinal/30">
          <div className="rounded-[14px] bg-background/95 backdrop-blur px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                <Trophy className="size-4" />
                Season Record
              </h2>
              <span className="text-xs text-muted-foreground">
                {finishedGames.length} game{finishedGames.length !== 1 && "s"}{" "}
                played
              </span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-green-400 led-glow-green tabular-nums">
                  {wins}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Wins
                </p>
              </div>
              <div className="text-3xl font-light text-muted-foreground/30">
                &mdash;
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-cardinal-bright led-glow-red tabular-nums">
                  {losses}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Losses
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile safe area */}
      <div className="h-4" />
    </div>
  );
}

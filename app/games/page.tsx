"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { GameData, GameStatus } from "@/lib/types";

function statusVariant(status: GameStatus) {
  switch (status) {
    case "live":
      return "default" as const;
    case "final":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function statusLabel(status: GameStatus) {
  switch (status) {
    case "live":
      return "Live";
    case "final":
      return "Final";
    default:
      return "Scheduled";
  }
}

function gameHref(game: GameData) {
  switch (game.gameStatus) {
    case "live":
      return `/games/${game.id}/live`;
    case "scheduled":
      return `/games/${game.id}/lineup`;
    default:
      return `/games/${game.id}/lineup`;
  }
}

export default function GamesPage() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => setGames(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Games</h1>
        <Button size="sm" render={<Link href="/games/new" />}>
          <Plus className="size-4 mr-1" />
          New Game
        </Button>
      </header>

      {games.length === 0 ? (
        <EmptyState
          title="No games yet"
          description="Create your first game to generate lineups."
          action={
            <Button render={<Link href="/games/new" />}>
              New Game
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((game) => (
            <Link key={game.id} href={gameHref(game)}>
              <Card className="transition-shadow hover:shadow-md active:shadow-sm">
                <CardContent className="flex items-center gap-4 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      vs {game.opponentName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(game.gameDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={statusVariant(game.gameStatus)}>
                      {statusLabel(game.gameStatus)}
                    </Badge>
                    {game.gameStatus === "final" &&
                      game.finalTeamScore !== null &&
                      game.finalOpponentScore !== null && (
                        <span className="text-sm font-mono font-semibold">
                          {game.finalTeamScore}-{game.finalOpponentScore}
                        </span>
                      )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
